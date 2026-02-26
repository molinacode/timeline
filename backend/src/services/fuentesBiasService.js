/**
 * Carga fuentes por sesgo desde JSON separados (progresista, centrista, conservadora)
 * y obtiene noticias RSS de cada grupo.
 */
import Parser from 'rss-parser'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getSupabase } from '../config/supabase.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const parser = new Parser({
  timeout: 12000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (compatible; TimeLineRSS/1.0; +https://github.com/timeline)',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
  },
})

const VERBOSE_RSS = process.env.RSS_VERBOSE_ERRORS === 'true'

const BIAS_FILES = [
  'progresistas.json',
  'centristas.json',
  'conservadoras.json',
]
const DATA_DIR = path.join(__dirname, '../../data/fuentes-por-sesgo')

/**
 * Carga un archivo JSON de fuentes por sesgo
 */
function loadBiasFile(filename) {
  const filePath = path.join(DATA_DIR, filename)
  if (!fs.existsSync(filePath)) return null
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    console.error(`[fuentesBias] Error cargando ${filename}:`, err.message)
    return null
  }
}

/**
 * Devuelve todas las fuentes agrupadas por sesgo
 * { progressive: [...], centrist: [...], conservative: [...] }
 */
export function getSourcesByBias() {
  const result = {
    progressive: [],
    centrist: [],
    conservative: [],
  }

  for (const file of BIAS_FILES) {
    const data = loadBiasFile(file)
    if (!data?.sources?.length) continue

    const bias =
      data.bias ||
      (file.includes('progres')
        ? 'progressive'
        : file.includes('centr')
        ? 'centrist'
        : 'conservative')
    const sources = data.sources.map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      rssUrl: s.rssUrl,
      bias,
    }))

    if (bias === 'progressive') result.progressive = sources
    else if (bias === 'centrist') result.centrist = sources
    else result.conservative = sources
  }

  return result
}

const POLITICS_KEYWORDS = [
  'politica',
  'política',
  'politicas',
  'políticas',
  'espana',
  'españa',
  'nacional',
  'gobierno',
  'congreso',
  'elecciones',
]

function isPolitics(item) {
  const cats = (item.categories || []).map((c) => (c || '').toLowerCase())
  const title = (item.title || '').toLowerCase()
  const desc = (item.description || '').toLowerCase()
  const all = [...cats, title, desc].join(' ')
  return POLITICS_KEYWORDS.some((kw) => all.includes(kw))
}

function normalizeTitle(title) {
  return (title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
}

function titleSimilarity(a, b) {
  const wordsA = new Set(normalizeTitle(a))
  const wordsB = new Set(normalizeTitle(b))
  if (wordsA.size === 0 || wordsB.size === 0) return 0
  let overlap = 0
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++
  }
  return overlap / Math.min(wordsA.size, wordsB.size)
}

async function fetchFeedItems(rssUrl, sourceName, bias) {
  try {
    const feed = await parser.parseURL(rssUrl)
    return (feed.items || []).map((item) => ({
      title: item.title?.trim() || '',
      link: item.link?.trim() || '',
      description:
        item.contentSnippet || item.content || item.description || '',
      pubDate: item.pubDate || '',
      isoDate: item.isoDate || '',
      image: item.enclosure?.url || item['media:content']?.$?.url || null,
      source: sourceName,
      sourceBias: bias,
      categories: item.categories || [],
    }))
  } catch (err) {
    if (VERBOSE_RSS) {
      console.error(`[fuentesBias] Error ${sourceName} (${rssUrl}):`, err.message)
    }
    return []
  }
}

/**
 * Obtiene noticias agrupadas por sesgo
 * limitPerBias: cuántas noticias máximo por cada sesgo (default 15)
 */
export async function fetchNewsByBias(limitPerBias = 15) {
  const byBias = getSourcesByBias()
  const result = {
    progressive: [],
    centrist: [],
    conservative: [],
  }

  for (const [bias, sources] of Object.entries(byBias)) {
    if (sources.length === 0) continue

    const results = await Promise.allSettled(
      sources.map((s) => fetchFeedItems(s.rssUrl, s.name, bias))
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
      console.log(`[fuentesBias] ${bias}: ${failed}/${sources.length} fuentes no disponibles`)
    }

    const sorted = allItems.sort((a, b) => {
      const dateA = new Date(a.isoDate || a.pubDate || 0).getTime()
      const dateB = new Date(b.isoDate || b.pubDate || 0).getTime()
      return dateB - dateA
    })

    result[bias] = sorted.slice(0, limitPerBias)
  }

  return result
}

/**
 * Comparador: 15 noticias más importantes. Para cada una:
 * - 3 cards principales (1 progresista, 1 centrista, 1 conservadora)
 * - Lista de otras fuentes que cubren la misma noticia (estilo ground.news)
 */
export async function fetchNewsByBiasMatched(limitGroups = 15) {
  const byBias = getSourcesByBias()
  const allByBias = { progressive: [], centrist: [], conservative: [] }

  for (const [bias, sources] of Object.entries(byBias)) {
    if (sources.length === 0) continue

    const results = await Promise.allSettled(
      sources.map((s) => fetchFeedItems(s.rssUrl, s.name, bias))
    )

    const items = []
    for (const r of results) {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        items.push(...r.value)
      }
    }

    let filtered = items.filter((i) =>
      isPolitics({ categories: i.categories, title: i.title, description: i.description })
    )
    if (filtered.length < 5) filtered = items

    const sorted = filtered.sort((a, b) => {
      const dateA = new Date(a.isoDate || a.pubDate || 0).getTime()
      const dateB = new Date(b.isoDate || b.pubDate || 0).getTime()
      return dateB - dateA
    })

    allByBias[bias] = sorted.slice(0, 80)
  }

  const groups = []
  const usedLinks = new Set()

  for (const prog of allByBias.progressive) {
    if (groups.length >= limitGroups) break

    const mainProg = prog
    let bestCentrist = null
    let bestCentristSim = 0.3
    let bestConservative = null
    let bestConservativeSim = 0.3

    for (const c of allByBias.centrist) {
      if (usedLinks.has(c.link)) continue
      const sim = titleSimilarity(prog.title, c.title)
      if (sim > bestCentristSim) {
        bestCentristSim = sim
        bestCentrist = c
      }
    }
    for (const c of allByBias.conservative) {
      if (usedLinks.has(c.link)) continue
      const sim = titleSimilarity(prog.title, c.title)
      if (sim > bestConservativeSim) {
        bestConservativeSim = sim
        bestConservative = c
      }
    }

    const mainCentrist = bestCentrist
    const mainConservative = bestConservative

    if (mainCentrist && mainConservative) {
      usedLinks.add(mainProg.link)
      usedLinks.add(mainCentrist.link)
      usedLinks.add(mainConservative.link)

      const allArticles = [
        mainProg,
        mainCentrist,
        mainConservative,
        ...allByBias.progressive.filter(
          (a) =>
            a.link !== mainProg.link &&
            titleSimilarity(mainProg.title, a.title) > 0.25
        ),
        ...allByBias.centrist.filter(
          (a) =>
            a.link !== mainCentrist?.link &&
            titleSimilarity(mainProg.title, a.title) > 0.25
        ),
        ...allByBias.conservative.filter(
          (a) =>
            a.link !== mainConservative?.link &&
            titleSimilarity(mainProg.title, a.title) > 0.25
        ),
      ]

      const mainSet = new Set(
        [mainProg.link, mainCentrist?.link, mainConservative?.link].filter(Boolean)
      )
      const otherSources = allArticles
        .filter((a) => !mainSet.has(a.link))
        .slice(0, 15)

      groups.push({
        progressive: mainProg,
        centrist: mainCentrist,
        conservative: mainConservative,
        otherSources,
      })
    }
  }

  // Enriquecer con etiquetas basadas en categorías especiales de Supabase
  try {
    const supabase = getSupabase()
    const { data: specials } = await supabase
      .from('source_categories')
      .select('name')
      .eq('is_special', true)

    const specialNames =
      specials?.map((c) => (c.name || '').toString().trim()).filter(Boolean) ?? []

    if (specialNames.length > 0) {
      for (const g of groups) {
        const tags = new Set()
        const texts = [
          g.progressive?.title,
          g.progressive?.description,
          g.centrist?.title,
          g.centrist?.description,
          g.conservative?.title,
          g.conservative?.description,
        ]
          .filter(Boolean)
          .map((t) => t.toLowerCase())

        for (const name of specialNames) {
          const lower = name.toLowerCase()
          if (texts.some((txt) => txt.includes(lower))) {
            tags.add(name)
          }
        }

        if (tags.size > 0) {
          g.tags = Array.from(tags)
        }
      }
    }
  } catch (err) {
    if (VERBOSE_RSS) {
      console.error('[fuentesBias] Error cargando categorías especiales:', err.message)
    }
  }

  return { groups }
}
