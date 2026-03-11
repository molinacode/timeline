import axios from 'axios'
import { parseStringPromise } from 'xml2js'
import { getSupabase } from '../config/supabase.js'
import { fetchFallbackImageFromHtml } from './imageExtractorService.js'

function getDefaultLaRazonSitemapUrl() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 0-based -> 1..12
  return `https://www.larazon.es/sitemaps/content_${year}_${month}.xml`
}

const SITEMAP_URL = process.env.LARAZON_SITEMAP_URL || getDefaultLaRazonSitemapUrl()

async function ensureLaRazonSource(supabase) {
  const id = 'larazon'
  const { data: existing } = await supabase
    .from('news_sources')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (existing) return id

  await supabase.from('news_sources').insert({
    id,
    name: 'La Razón',
    rss_url: null,
    homepage_url: 'https://www.larazon.es',
    is_active: true,
  })

  return id
}

async function sitemapUrls(url) {
  const res = await axios.get(url, {
    timeout: 15000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; TimeLineRSS/1.0; +https://github.com/timeline)',
      Accept: 'application/xml,text/xml,*/*',
    },
  })
  const xml = await parseStringPromise(res.data)
  const entries = xml.urlset?.url || []
  return entries.map((u) => ({
    loc: u.loc?.[0],
    lastmod: u.lastmod?.[0] || null,
  }))
}

export async function importLaRazonFromSitemap(limit = 100) {
  const supabase = getSupabase()
  const sourceId = await ensureLaRazonSource(supabase)

  const urls = await sitemapUrls(SITEMAP_URL)
  const slice = urls.slice(0, limit)

  let inserted = 0

  for (const { loc: link, lastmod } of slice) {
    if (!link) continue

    const { data: existing } = await supabase
      .from('news_items')
      .select('id')
      .eq('source_id', sourceId)
      .eq('link', link)
      .limit(1)
      .maybeSingle()

    if (existing) continue

    let imageUrl = null
    try {
      imageUrl = await fetchFallbackImageFromHtml(link)
    } catch (e) {
      console.error('[laRazonSitemap] Error imagen', link, e.message)
    }

    const now = new Date().toISOString()
    await supabase.from('news_items').insert({
      source_id: sourceId,
      title: link, // si quieres luego se puede mejorar extrayendo título HTML
      description: null,
      content: null,
      link,
      image_url: imageUrl,
      pub_date: lastmod || now,
      guid: link,
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

    inserted++
  }

  console.log(`[laRazonSitemap] Insertadas ${inserted} noticias nuevas`)
  return inserted
}