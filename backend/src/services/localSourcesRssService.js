/**
 * Obtiene noticias desde las fuentes locales por región (sourcesByRegion.json).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { fetchAndParseRss } from './rssFetch.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadSourcesByRegion() {
  const candidates = [
    path.join(__dirname, '../../data/sourcesByRegion.json'),
    path.join(process.cwd(), 'backend/data/sourcesByRegion.json'),
    path.join(process.cwd(), 'data/sourcesByRegion.json'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8')
      const data = JSON.parse(raw)
      return Array.isArray(data.regions) ? data.regions : []
    }
  }
  return []
}

async function fetchFeedItems(rssUrl, sourceName) {
  try {
    const feed = await fetchAndParseRss(rssUrl, { timeout: 12000 })
    return (feed.items || []).map((item) => ({
      title: item.title?.trim() || '',
      link: item.link?.trim() || '',
      description:
        item.contentSnippet || item.content || item.description || '',
      pubDate: item.pubDate || '',
      isoDate: item.isoDate || '',
      image: item.enclosure?.url || item['media:content']?.$?.url || null,
      source: sourceName,
    }))
  } catch (err) {
    console.error(
      '[localSources] Error obteniendo RSS de',
      sourceName,
      rssUrl,
      '-',
      err.message
    )
    return []
  }
}

/**
 * Obtiene noticias de las fuentes locales de una región.
 * @param {string} regionId - id de región (madrid, andalucia, galicia, baleares, etc.)
 * @param {number} limit - máximo de noticias
 */
export async function fetchNewsByRegion(regionId, limit = 30) {
  const regions = loadSourcesByRegion()
  const region = regions.find((r) => r.id === regionId)
  if (!region?.sources?.length) return []

  const sourcesWithRss = region.sources.filter(
    (s) => s.rssUrl && String(s.rssUrl).trim() !== ''
  )
  if (sourcesWithRss.length === 0) {
    console.error(
      '[localSources] Región sin fuentes con rssUrl:',
      regionId,
      '- total fuentes definidas:',
      region.sources.length
    )
    return []
  }

  const results = await Promise.allSettled(
    sourcesWithRss.map((s) => fetchFeedItems(s.rssUrl, s.name))
  )

  const allItems = []
  results.forEach((result, index) => {
    const s = sourcesWithRss[index]
    if (result.status === 'fulfilled') {
      const items = Array.isArray(result.value) ? result.value : []
      if (items.length === 0) {
        console.warn(
          '[localSources] Fuente local sin noticias:',
          s.name,
          s.rssUrl
        )
      } else {
        allItems.push(...items)
      }
    } else {
      console.error(
        '[localSources] Promesa rechazada para fuente local:',
        s.name,
        s.rssUrl,
        '-',
        result.reason?.message || result.reason
      )
    }
  })

  const sorted = allItems.sort((a, b) => {
    const dateA = new Date(a.isoDate || a.pubDate || 0).getTime()
    const dateB = new Date(b.isoDate || b.pubDate || 0).getTime()
    return dateB - dateA
  })

  return sorted.slice(0, limit)
}
