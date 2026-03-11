/**
 * Sincroniza news_sources (Supabase) con data/fuentes-base.json.
 * Usado por el script CLI y por POST /api/admin/sync-news-sources.
 */
import fs from 'fs'
import path from 'path'

const FUENTES_BASE_PATH = path.join(process.cwd(), 'data/fuentes-base.json')

function normalizeUrlForMatch(url) {
  if (!url || typeof url !== 'string') return ''
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

function loadFuentesBase() {
  if (!fs.existsSync(FUENTES_BASE_PATH)) {
    return []
  }
  const data = JSON.parse(fs.readFileSync(FUENTES_BASE_PATH, 'utf8'))
  return Array.isArray(data.sources) ? data.sources : []
}

/**
 * Sincroniza la tabla news_sources con fuentes-base.json.
 * @param {object} supabase - Cliente Supabase
 * @returns {{ updated: number, inserted: number, deactivated: number, activeCount: number }}
 */
export async function syncNewsSourcesFromJson(supabase) {
  const sources = loadFuentesBase()

  const result = { updated: 0, inserted: 0, deactivated: 0, activeCount: 0 }

  if (sources.length === 0) {
    return result
  }

  const { data: existingRows, error: fetchError } = await supabase
    .from('news_sources')
    .select('id, name, website_url, rss_url, is_active')

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  const byNormalizedUrl = new Map()
  for (const row of existingRows || []) {
    const key = normalizeUrlForMatch(row.website_url || row.rss_url || '')
    if (key) byNormalizedUrl.set(key, row)
  }

  const now = new Date().toISOString()
  const keptIds = new Set()

  for (const s of sources) {
    const url = s.url || s.websiteUrl || ''
    const rssUrl = (s.rssUrl ?? s.rss_url ?? '').trim()
    const normalized = normalizeUrlForMatch(url)
    if (!normalized) continue

    const payload = {
      name: s.name || 'Sin nombre',
      rss_url: rssUrl || '',
      website_url: url || null,
      description: s.description || null,
      is_active: true,
      is_public: true,
      updated_at: now,
    }

    const existing = byNormalizedUrl.get(normalized)

    if (existing) {
      const { error: upErr } = await supabase
        .from('news_sources')
        .update(payload)
        .eq('id', existing.id)
      if (!upErr) {
        keptIds.add(existing.id)
        result.updated++
      }
    } else {
      const { data: insertedRow, error: inErr } = await supabase
        .from('news_sources')
        .insert({
          ...payload,
          created_at: now,
        })
        .select('id')
        .single()
      if (!inErr && insertedRow) {
        keptIds.add(insertedRow.id)
        result.inserted++
      }
    }
  }

  result.activeCount = keptIds.size

  const allIds = (existingRows || []).map((r) => r.id)
  const toDeactivate = allIds.filter((id) => !keptIds.has(id))

  if (toDeactivate.length > 0) {
    const { error: deactErr } = await supabase
      .from('news_sources')
      .update({ is_active: false, updated_at: now })
      .in('id', toDeactivate)
    if (!deactErr) {
      result.deactivated = toDeactivate.length
    }
  }

  return result
}
