/**
 * Obtiene RSS de las fuentes en news_sources y guarda/actualiza news_items.
 */
import Parser from 'rss-parser'
import { getSupabase } from '../config/supabase.js'

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (compatible; TimeLineRSS/1.0; +https://github.com/timeline)',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
  },
})

async function fetchFeed(rssUrl) {
  const feed = await parser.parseURL(rssUrl)
  return (feed.items || []).map((item) => ({
    title: item.title?.trim() || '',
    link: item.link?.trim() || '',
    description: item.contentSnippet || item.content || item.description || '',
    content: item.content || null,
    pubDate: item.pubDate || null,
    isoDate: item.isoDate || null,
    guid: item.guid?.trim() || item.link?.trim() || '',
    imageUrl: item.enclosure?.url || item['media:content']?.$?.url || null,
  }))
}

/**
 * Inserta un item en news_items si no existe (por source_id + guid o link).
 */
async function upsertNewsItem(supabase, sourceId, item) {
  const guid = item.guid || item.link || ''
  const link = item.link || ''

  if (guid) {
    const { data: byGuid } = await supabase
      .from('news_items')
      .select('id')
      .eq('source_id', sourceId)
      .eq('guid', guid)
      .limit(1)
      .maybeSingle()
    if (byGuid) return false
  }
  const { data: byLink } = await supabase
    .from('news_items')
    .select('id')
    .eq('source_id', sourceId)
    .eq('link', link)
    .limit(1)
    .maybeSingle()
  if (byLink) return false

  const now = new Date().toISOString()
  await supabase.from('news_items').insert({
    source_id: sourceId,
    title: item.title || '(sin título)',
    description: item.description || null,
    content: item.content || null,
    link: link || '',
    image_url: item.imageUrl || null,
    pub_date: item.pubDate || item.isoDate || null,
    guid: guid || null,
    category: null,
    region: null,
    tags: null,
    topic_tags: null,
    is_featured: false,
    is_last_hour: false,
    is_highlighted: false,
    relevance_score: 0,
    view_count: 0,
    created_at: now,
    updated_at: now,
  })
  return true
}

async function updateSourceLastFetched(supabase, sourceId) {
  const now = new Date().toISOString()
  await supabase
    .from('news_sources')
    .update({ last_fetched: now, updated_at: now })
    .eq('id', sourceId)
}

async function logFetchResult(supabase, sourceId, status, itemsFetched, errorMessage) {
  try {
    const now = new Date().toISOString()
    await supabase.from('fetch_logs').insert({
      source_id: sourceId,
      status,
      items_fetched: itemsFetched ?? 0,
      error_message: errorMessage || null,
      created_at: now,
    })
  } catch (e) {
    // Ignorar errores de logging
  }
}

/**
 * Obtiene todas las fuentes activas y rellena news_items desde sus RSS.
 */
export async function fetchAllSourcesIntoNews() {
  const supabase = getSupabase()

  const { data: sourcesRows, error: sourcesError } = await supabase
    .from('news_sources')
    .select('id, name, rss_url')
    .eq('is_active', true)

  if (sourcesError) throw sourcesError
  const sources = (sourcesRows || []).filter(
    (s) => s.rss_url && String(s.rss_url).trim() !== ''
  )

  let totalInserted = 0
  for (const source of sources) {
    try {
      const items = await fetchFeed(source.rss_url)
      let inserted = 0
      for (const item of items) {
        if (!item.link && !item.guid) continue
        const ok = await upsertNewsItem(supabase, source.id, item)
        if (ok) {
          inserted += 1
          totalInserted += 1
        }
      }
      await updateSourceLastFetched(supabase, source.id)
      await logFetchResult(supabase, source.id, 'ok', items.length, null)
    } catch (err) {
      console.error(
        `[sourcesRss] Error fetching ${source.name} (${source.rss_url}):`,
        err.message
      )
      await logFetchResult(supabase, source.id, 'error', 0, err.message)
    }
  }

  return { sourcesProcessed: sources.length, itemsInserted: totalInserted }
}
