/**
 * Obtiene noticias desde las fuentes base (fuentes-base.json).
 * No requiere BD: busca directamente en los feeds RSS.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { fetchAndParseRss } from './rssFetch.js'
import { fetchFallbackImageFromHtml } from './imageExtractorService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadFuentesBase() {
  const candidates = [
    path.join(__dirname, '../../data/fuentes-base.json'),
    path.join(process.cwd(), 'backend/data/fuentes-base.json'),
    path.join(process.cwd(), 'data/fuentes-base.json'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf8')
        const data = JSON.parse(raw)
        return Array.isArray(data.sources) ? data.sources : []
      } catch (err) {
        if (VERBOSE_RSS) console.error('[fuentesBase] Error leyendo', p, err.message)
        continue
      }
    }
  }
  return []
}

const VERBOSE_RSS = process.env.RSS_VERBOSE_ERRORS === 'true'

const ULTIMA_HORA_KEYWORDS = [
  'ultima hora',
  'última hora',
  'últimas noticias',
  'breaking',
  'breaking news',
  'última hora',
  'urgente',
  'flash',
]

function isUltimaHora(item) {
  const cats = item.categories || []
  const allText = [...cats, item.title || '', item.description || '']
    .join(' ')
    .toLowerCase()
  return ULTIMA_HORA_KEYWORDS.some((kw) => allText.includes(kw.toLowerCase()))
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
      categories: item.categories || [],
    }))
  } catch (err) {
    if (VERBOSE_RSS) {
      console.error(
        `[fuentesBase] Error ${sourceName} (${rssUrl}):`,
        err.message
      )
    }
    return []
  }
}

/** Una fuente puede tener rssUrl (uno) o rssUrls (varios). Devuelve [{ url, name }] para cada feed a consultar. */
function getFeedTasks(sources) {
  const tasks = []
  for (const s of sources) {
    const urls = Array.isArray(s.rssUrls) && s.rssUrls.length > 0
      ? s.rssUrls
      : (s.rssUrl ? [s.rssUrl] : [])
    for (const url of urls) {
      if (url && String(url).trim()) tasks.push({ url: url.trim(), name: s.name })
    }
  }
  return tasks
}

export async function fetchFuentesBaseNews(limit = 50) {
  const sources = loadFuentesBase()
  if (sources.length === 0) return []

  const tasks = getFeedTasks(sources)
  const results = await Promise.allSettled(
    tasks.map((t) => fetchFeedItems(t.url, t.name))
  )

  const allItems = []
  let failed = 0
  for (const r of results) {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) {
      allItems.push(...r.value)
    } else {
      failed++
    }
  }

  if (failed > 0 && !VERBOSE_RSS) {
    console.log(
      `[fuentesBase] ${failed}/${tasks.length} feeds no disponibles`
    )
  }

  const sorted = allItems.sort((a, b) => {
    const dateA = new Date(a.isoDate || a.pubDate || 0).getTime()
    const dateB = new Date(b.isoDate || b.pubDate || 0).getTime()
    return dateB - dateA
  })

  return sorted.slice(0, limit)
}

/**
 * Noticias de última hora: filtradas por etiquetas "ultima hora" en fuentes,
 * ordenadas por fecha. Máximo 15. Si no hay etiquetadas, devuelve las 15 más recientes.
 */
export async function fetchUltimaHoraNews(limit = 15) {
  const sources = loadFuentesBase()
  if (sources.length === 0) return []

  const tasks = getFeedTasks(sources)
  const results = await Promise.allSettled(
    tasks.map((t) => fetchFeedItems(t.url, t.name))
  )

  const allItems = []
  for (const r of results) {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) {
      allItems.push(...r.value)
    }
  }

  const withUltimaHora = allItems.filter((i) =>
    isUltimaHora({
      categories: i.categories || [],
      title: i.title,
      description: i.description,
    })
  )

  const toReturn = withUltimaHora.length > 0 ? withUltimaHora : allItems

  const sorted = toReturn.sort((a, b) => {
    const dateA = new Date(a.isoDate || a.pubDate || 0).getTime()
    const dateB = new Date(b.isoDate || b.pubDate || 0).getTime()
    return dateB - dateA
  })

  return sorted.slice(0, limit).map(({ categories, ...rest }) => rest)
}

/**
 * Noticias por categoría (Viajes, Tecnología, Deporte, etc.) desde fuentes-base.
 * Filtra por item.categories del RSS.
 */
export async function fetchNewsByCategory(category, limit = 20) {
  const sources = loadFuentesBase()
  if (sources.length === 0) return []

  const tasks = getFeedTasks(sources)
  const results = await Promise.allSettled(
    tasks.map((t) => fetchFeedItems(t.url, t.name))
  )

  const allItems = []
  for (const r of results) {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) {
      allItems.push(...r.value)
    }
  }

  const cat = String(category || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  const match = (item) => {
    const cats = (item.categories || []).map((c) =>
      String(c ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    )
    const title = String(item?.title ?? '').toLowerCase()
    const desc = String(item?.description ?? '').toLowerCase()
    const all = [...cats, title, desc].join(' ')
    return (all && all.includes(cat)) || cats.some((c) => c && c.includes(cat))
  }

  const filtered = allItems.filter((item) => {
    try {
      return match(item)
    } catch {
      return false
    }
  })

  // Enriquecer con imagen de la página para algunos ítems sin imagen
  const toEnrich = filtered
    .filter((i) => !i.image && i.link)
    .slice(0, 8)
  if (toEnrich.length > 0) {
    await Promise.all(
      toEnrich.map(async (i) => {
        try {
          const url = await fetchFallbackImageFromHtml(i.link)
          if (url) i.image = url
        } catch {
          // ignorar errores individuales
        }
      })
    )
  }

  const sorted = filtered.sort((a, b) => {
    const dateA = Number(new Date(a?.isoDate || a?.pubDate || 0)) || 0
    const dateB = Number(new Date(b?.isoDate || b?.pubDate || 0)) || 0
    return dateB - dateA
  })

  return sorted.slice(0, limit).map(({ categories, ...rest }) => rest)
}
