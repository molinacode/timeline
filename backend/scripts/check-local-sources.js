import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import * as cheerio from 'cheerio'

const PRENSA_GENERAL_URL = 'https://www.prensaescrita.com/prensadigital.php'

// Mapeo aproximado de id de región -> página de prensaescrita
const REGION_PRENSA_URLS = {
  andalucia: 'https://www.prensaescrita.com/andalucia.php',
  cvalenciana: 'https://www.prensaescrita.com/valenciana.php',
  galicia: 'https://www.prensaescrita.com/galicia.php',
  madrid: 'https://www.prensaescrita.com/madrid.php',
  cmancha: 'https://www.prensaescrita.com/castillam.php',
  castillaleon: 'https://www.prensaescrita.com/castillal.php',
  catalunya: 'https://www.prensaescrita.com/catalunya.php',
  paisVasco: 'https://www.prensaescrita.com/euskadi.php',
  extremadura: 'https://www.prensaescrita.com/extremadura.php',
  murcia: 'https://www.prensaescrita.com/murcia.php',
  navarra: 'https://www.prensaescrita.com/navarra.php',
  rioja: 'https://www.prensaescrita.com/rioja.php',
  canarias: 'https://www.prensaescrita.com/canarias.php',
  baleares: 'https://www.prensaescrita.com/baleares.php',
  asturias: 'https://www.prensaescrita.com/asturias.php',
  aragon: 'https://www.prensaescrita.com/aragon.php',
  cantabria: 'https://www.prensaescrita.com/cantabria.php',
  ceutamelilla: 'https://www.prensaescrita.com/ceutaym.php',
}

function loadSourcesByRegion() {
  const filePath = path.join(process.cwd(), 'data/sourcesByRegion.json')
  const raw = fs.readFileSync(filePath, 'utf8')
  const data = JSON.parse(raw)
  const regions = Array.isArray(data.regions) ? data.regions : []

  const allSources = []
  for (const region of regions) {
    for (const s of region.sources || []) {
      allSources.push({
        regionId: region.id,
        regionName: region.name,
        id: s.id,
        name: s.name,
        url: s.url,
      })
    }
  }
  return { filePath, regions, allSources }
}

function normalizeDomain(url) {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

async function fetchDomainsFromPage(url) {
  const res = await axios.get(url, {
    timeout: 15000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; TimeLineRSS/1.0; +https://github.com/timeline)',
    },
  })
  const $ = cheerio.load(res.data)

  const domains = new Set()

  $('a[href^="http"]').each((_, el) => {
    const href = $(el).attr('href')
    const d = normalizeDomain(href)
    if (d) domains.add(d)
  })

  return domains
}

async function buildRegionDomains() {
  const cache = new Map()

  // dominios generales de digitales
  const generalDomains = await fetchDomainsFromPage(PRENSA_GENERAL_URL)

  for (const [regionId, url] of Object.entries(REGION_PRENSA_URLS)) {
    try {
      const domains = await fetchDomainsFromPage(url)
      cache.set(regionId, { url, domains })
    } catch (e) {
      console.error(`[check-local-sources] Error fetching ${url}:`, e.message)
      cache.set(regionId, { url, domains: new Set() })
    }
  }

  return { cache, generalDomains }
}

async function main() {
  const { filePath, allSources } = loadSourcesByRegion()
  const { cache: regionDomainsCache, generalDomains } = await buildRegionDomains()

  const seenDomains = new Map()
  const duplicates = []
  const notInPrensa = []
  const ok = []

  for (const s of allSources) {
    const d = normalizeDomain(s.url)
    if (!d) continue

    const key = d

    if (seenDomains.has(key)) {
      duplicates.push({
        domain: key,
        first: seenDomains.get(key),
        duplicate: s,
      })
    } else {
      seenDomains.set(key, s)
    }

    const entry = {
      regionId: s.regionId,
      regionName: s.regionName,
      id: s.id,
      name: s.name,
      url: s.url,
    }

    const regionInfo = regionDomainsCache.get(s.regionId) || { domains: new Set() }
    const inRegion = regionInfo.domains.has(d)
    const inGeneral = generalDomains.has(d)

    if (inRegion || inGeneral) {
      ok.push(entry)
    } else {
      notInPrensa.push(entry)
    }
  }

  console.log('=== Fuentes LOCALES OK (dominio está en prensadigital) ===')
  console.log(ok)

  console.log('\n=== Fuentes LOCALES NO encontradas en prensadigital ===')
  console.log(notInPrensa)

  console.log('\n=== Fuentes LOCALES duplicadas por dominio ===')
  console.log(duplicates)

  console.log(`\nAnalizadas ${allSources.length} fuentes locales de ${filePath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

