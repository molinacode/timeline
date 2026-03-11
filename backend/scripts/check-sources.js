import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import * as cheerio from 'cheerio'

const PRENSA_URL = 'https://www.prensaescrita.com/prensadigital.php'

function loadFuentesBase() {
  const filePath = path.join(process.cwd(), 'data/fuentes-base.json')
  const raw = fs.readFileSync(filePath, 'utf8')
  const data = JSON.parse(raw)
  return { filePath, sources: data.sources || [] }
}

// Solo queremos altas automáticas para estos dominios (tirada nacional / económicos / verificados)
const ALLOWED_DOMAINS = new Set([
  'elpais.com',
  'elmundo.es',
  '20minutos.es',
  'abc.es',
  'larazon.es',
  'publico.es',
  'elespanol.com',
  'elconfidencial.com',
  'eldebate.com',
  'eldiario.es',
  'huffingtonpost.es',
  'okdiario.com',
  'vozpopuli.com',
  'libertaddigital.com',
  'marca.com',
  'as.com',
  'mundodeportivo.com',
  'cincodias.elpais.com',
  'eleconomista.es',
  'expansion.com',
  'rtve.es',
  'infolibre.es',
  'elplural.com',
  'elsaltodiario.com',
  'lamarea.com',
  'ctxt.es',
  'infobae.com',
  'theobjective.com',
  'maldita.es',
  'electomania.es',
])

function normalizeDomain(url) {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

async function fetchPrensaDomains() {
  const res = await axios.get(PRENSA_URL, {
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

async function main() {
  const { filePath, sources } = loadFuentesBase()
  const prensaDomains = await fetchPrensaDomains()

  const seenDomains = new Set()
  const existingIds = new Set(sources.map((s) => s.id))
  const duplicates = []
  const notInPrensa = []
  const ok = []

  for (const s of sources) {
    const d = normalizeDomain(s.url)
    if (!d) continue

    if (seenDomains.has(d)) {
      duplicates.push({ id: s.id, name: s.name, url: s.url })
    } else {
      seenDomains.add(d)
    }

    if (prensaDomains.has(d)) {
      ok.push({ id: s.id, name: s.name, url: s.url })
    } else {
      notInPrensa.push({ id: s.id, name: s.name, url: s.url })
    }
  }

  console.log('=== Fuentes OK (dominio está en prensadigital) ===')
  console.log(ok)

  console.log('\n=== Fuentes NO encontradas en prensadigital ===')
  console.log(notInPrensa)

  console.log('\n=== Fuentes duplicadas por dominio ===')
  console.log(duplicates)

  console.log(`\nAnalizado ${sources.length} sources de ${filePath}`)

  // IMPORTAR nuevas fuentes: dominios permitidos que están en prensadigital
  const existingDomains = new Set(
    sources
      .map((s) => normalizeDomain(s.url))
      .filter(Boolean)
  )

  const newSources = []

  for (const d of prensaDomains) {
    if (!ALLOWED_DOMAINS.has(d)) continue
    if (existingDomains.has(d)) continue

    const baseName = d.split('.')[0] || d
    const prettyName = baseName.charAt(0).toUpperCase() + baseName.slice(1)
    const baseId = baseName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    let id = baseId
    let i = 1
    while (existingIds.has(id)) {
      id = `${baseId}-${i}`
      i += 1
    }
    existingIds.add(id)

    const url = `https://${d}`

    const src = {
      id,
      name: prettyName,
      url,
      rssUrl: '',
      description: 'Añadido desde Prensaescrita (pendiente de revisión)',
    }
    newSources.push(src)
    sources.push(src)
  }

  if (newSources.length > 0) {
    console.log(`\n=== Añadiendo ${newSources.length} fuentes nuevas desde Prensaescrita ===`)
    console.log(newSources)
    fs.writeFileSync(filePath, JSON.stringify({ sources }, null, 2), 'utf8')
    console.log(`\nfuentes-base.json actualizado en ${filePath}`)
  } else {
    console.log('\nNo hay nuevas fuentes que añadir desde Prensaescrita.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})