import { getSupabase } from '../config/supabase.js'
import fs from 'fs'
import path from 'path'

function normalizeDomain(url) {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./i, '').toLowerCase()
  } catch {
    return null
  }
}

function loadSourcesByRegion() {
  const candidates = [
    path.join(process.cwd(), 'backend', 'data', 'sourcesByRegion.json'),
    path.join(process.cwd(), 'data', 'sourcesByRegion.json'),
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

/**
 * Sincroniza local_news_sources con backend/data/sourcesByRegion.json
 * - Crea o actualiza filas para cada fuente con rssUrl no vacío
 * - No elimina fuentes existentes (por seguridad)
 */
export async function syncLocalNewsSourcesFromJson() {
  const supabase = getSupabase()
  const regions = loadSourcesByRegion()

  const rows = []
  for (const region of regions) {
    for (const s of region.sources || []) {
      if (!s.rssUrl || String(s.rssUrl).trim() === '') continue
      rows.push({
        region_id: region.id,
        region_name: region.name || null,
        name: s.name,
        website_url: s.url || null,
        rss_url: String(s.rssUrl).trim(),
      })
    }
  }

  if (rows.length === 0) {
    return { upserted: 0 }
  }

  const now = new Date().toISOString()
  let upserted = 0

  for (const r of rows) {
    // 1) Buscar si ya existe la fuente para esa región+nombre
    const { data: existing, error: selectError } = await supabase
      .from('local_news_sources')
      .select('id')
      .eq('region_id', r.region_id)
      .eq('name', r.name)
      .maybeSingle()

    if (selectError) {
      // Cualquier error de lectura aborta la sincronización completa
      throw selectError
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from('local_news_sources')
        .update({
          website_url: r.website_url,
          rss_url: r.rss_url,
          region_name: r.region_name,
          updated_at: now,
        })
        .eq('id', existing.id)

      if (updateError) {
        // No contamos esta fila como upserted y propagamos el fallo
        throw updateError
      }

      upserted += 1
    } else {
      const { error: insertError } = await supabase.from('local_news_sources').insert({
        region_id: r.region_id,
        region_name: r.region_name,
        name: r.name,
        website_url: r.website_url,
        rss_url: r.rss_url,
        is_active: true,
        created_at: now,
        updated_at: now,
      })

      if (insertError) {
        // De nuevo: no incrementamos contador y abortamos
        throw insertError
      }

      upserted += 1
    }
  }

  return { upserted }
}

export async function listLocalNewsSourcesWithStatus() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('local_news_sources')
    .select(
      'id, region_id, region_name, name, website_url, rss_url, is_active, last_fetched, last_status, last_error_message'
    )
    .order('region_id', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

