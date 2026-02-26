import express from 'express'
import { getSupabase } from '../src/config/supabase.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// Caché simple en memoria: fuentes cambian poco; podemos cachear 60s
const SOURCES_CACHE_TTL_MS = 60_000
const sourcesCache = new Map()

const DISALLOWED_SOURCE_PATTERNS = [
  'porn',
  'porno',
  'sex',
  'xxx',
  'hentai',
  'gore',
  'snuff',
  'rape',
  'torture',
  'nazis',
  'neo-nazi',
  'kkk',
  'whitepower',
]

function getFromCache(cache, key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key)
    return null
  }
  return entry.value
}

function setInCache(cache, key, value, ttlMs) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs })
}

function looksIllegalOrAbusiveSource(name, rssUrl) {
  const text = `${name || ''} ${rssUrl || ''}`.toLowerCase()
  return DISALLOWED_SOURCE_PATTERNS.some((kw) => text.includes(kw))
}

// GET /api/sources?activeOnly=true
router.get('/sources', authenticateToken, async (req, res) => {
  const supabase = getSupabase()
  const activeOnly = req.query.activeOnly === 'true'

  const cacheKey = activeOnly ? 'active' : 'all'
  const cached = getFromCache(sourcesCache, cacheKey)
  if (cached) {
    return res.json(cached)
  }

  try {
    let query = supabase
      .from('news_sources')
      .select('id, name, rss_url, website_url, category, description, is_active')
      .order('name', { ascending: true })
    if (activeOnly) query = query.eq('is_active', true)
    const { data: rows, error } = await query

    if (error) throw error
    const payload = (rows || []).map((r) => ({
      id: r.id,
      name: r.name,
      rssUrl: r.rss_url,
      websiteUrl: r.website_url,
      category: r.category,
      description: r.description,
      isActive: !!r.is_active,
    }))

    setInCache(sourcesCache, cacheKey, payload, SOURCES_CACHE_TTL_MS)
    res.json(payload)
  } catch (error) {
    console.error('Error listando fuentes:', error)
    res.status(500).json({ error: 'Error al listar fuentes' })
  }
})

// POST /api/sources (admin)
router.post('/sources', authenticateToken, requireAdmin, async (req, res) => {
  const supabase = getSupabase()
  const { name, rssUrl, websiteUrl, category, description, isActive } =
    req.body || {}

  if (!name || !rssUrl) {
    return res.status(400).json({
      error: 'Datos inválidos',
      message: 'Los campos name y rssUrl son obligatorios',
    })
  }

  if (looksIllegalOrAbusiveSource(name, rssUrl)) {
    return res.status(400).json({
      error: 'Fuente no permitida',
      message:
        'Esta fuente parece contener contenido sexual explícito, violento o de odio y no está permitida en TimeLine.',
    })
  }

  try {
    const now = new Date().toISOString()
    const { data: created, error } = await supabase
      .from('news_sources')
      .insert({
        name,
        rss_url: rssUrl,
        website_url: websiteUrl || null,
        category: category || null,
        description: description || null,
        is_active: !!isActive,
        created_at: now,
        updated_at: now,
      })
      .select('id, name, rss_url, website_url, category, description, is_active')
      .single()

    if (error) throw error
    res.status(201).json({
      id: created.id,
      name: created.name,
      rssUrl: created.rss_url,
      websiteUrl: created.website_url,
      category: created.category,
      description: created.description,
      isActive: !!created.is_active,
    })
  } catch (error) {
    console.error('Error creando fuente:', error)
    res.status(500).json({ error: 'Error al crear fuente' })
  }
})

// PUT /api/sources/:id (admin)
router.put('/sources/:id', authenticateToken, requireAdmin, async (req, res) => {
  const supabase = getSupabase()
  const id = Number(req.params.id)
  const { name, rssUrl, websiteUrl, category, description, isActive } =
    req.body || {}

  try {
    const { data: existing, error: findErr } = await supabase
      .from('news_sources')
      .select('id')
      .eq('id', id)
      .maybeSingle()
    if (findErr || !existing) {
      return res.status(404).json({ error: 'Fuente no encontrada' })
    }

    const updates = { updated_at: new Date().toISOString() }
    if (name != null) updates.name = name
    if (rssUrl != null) updates.rss_url = rssUrl
    if (websiteUrl != null) updates.website_url = websiteUrl
    if (category != null) updates.category = category
    if (description != null) updates.description = description
    if (typeof isActive === 'boolean') updates.is_active = isActive

    const { data: updated, error: updateErr } = await supabase
      .from('news_sources')
      .update(updates)
      .eq('id', id)
      .select('id, name, rss_url, website_url, category, description, is_active')
      .single()

    if (updateErr) throw updateErr
    res.json({
      id: updated.id,
      name: updated.name,
      rssUrl: updated.rss_url,
      websiteUrl: updated.website_url,
      category: updated.category,
      description: updated.description,
      isActive: !!updated.is_active,
    })
  } catch (error) {
    console.error('Error actualizando fuente:', error)
    res.status(500).json({ error: 'Error al actualizar fuente' })
  }
})

// DELETE /api/sources/:id (admin)
router.delete('/sources/:id', authenticateToken, requireAdmin, async (req, res) => {
  const supabase = getSupabase()
  const id = Number(req.params.id)

  try {
    const { data: deleted, error } = await supabase
      .from('news_sources')
      .delete()
      .eq('id', id)
      .select('id')
    if (error) throw error
    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ error: 'Fuente no encontrada' })
    }
    res.status(204).send()
  } catch (error) {
    console.error('Error eliminando fuente:', error)
    res.status(500).json({ error: 'Error al eliminar fuente' })
  }
})

export default router
