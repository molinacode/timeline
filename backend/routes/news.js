import express from 'express'
import { getSupabase } from '../src/config/supabase.js'
import { fetchAggregatedRtveNews } from '../src/services/rtveRssService.js'
import {
  fetchFuentesBaseNews,
  fetchUltimaHoraNews,
  fetchNewsByCategory,
} from '../src/services/fuentesBaseRssService.js'
import { fetchNewsByRegion } from '../src/services/localSourcesRssService.js'
import {
  fetchNewsByBias,
  fetchNewsByBiasMatched,
  getSourcesByBias,
} from '../src/services/fuentesBiasService.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// En producción evitamos ir a los RSS en cada petición para mejorar rendimiento.
// Si quieres forzar el modo "en vivo" con RSS directos, pon USE_LIVE_RSS=true.
const USE_LIVE_RSS = process.env.USE_LIVE_RSS === 'true'

// Caché simple en memoria para respuestas de /api/news y /api/news/ultima-hora
const NEWS_CACHE_TTL_MS = 30_000
const ULTIMA_HORA_CACHE_TTL_MS = 30_000

const newsCache = new Map()
const ultimaHoraCache = new Map()

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
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  })
}

// GET /api/news - noticias del timeline (desde news_items, fuentes RSS configuradas)
router.get('/news', async (req, res) => {
  const send = (status, body) => {
    if (res.headersSent) return
    res.status(status).json(body)
  }
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200)
    const cacheKey = String(limit)
    const cached = getFromCache(newsCache, cacheKey)
    if (cached) {
      return send(200, cached)
    }

    const supabase = getSupabase()
    const { data: rows, error } = await supabase
      .from('news_items')
      .select('id, source_id, title, description, link, image_url, pub_date, created_at')
      .order('pub_date', { ascending: false })
      .limit(limit)

    if (error) throw error

    const sourceIds = [...new Set((rows || []).map((r) => r.source_id).filter(Boolean))]
    const sourceMap = new Map()
    if (sourceIds.length > 0) {
      const { data: sources } = await supabase
        .from('news_sources')
        .select('id, name')
        .in('id', sourceIds)
      ;(sources || []).forEach((s) => sourceMap.set(s.id, s.name))
    }

    const list = (rows || []).map((r) => ({
      id: r.id,
      sourceId: r.source_id,
      title: r.title,
      description: r.description,
      link: r.link,
      imageUrl: r.image_url,
      pubDate: r.pub_date,
      createdAt: r.created_at,
      sourceName: sourceMap.get(r.source_id) ?? null,
    }))

    setInCache(newsCache, cacheKey, list, NEWS_CACHE_TTL_MS)
    send(200, list)
  } catch (error) {
    console.error('Error en /api/news:', error.message, error)
    send(500, { error: 'Error al obtener noticias del timeline' })
  }
})

// GET /api/news/ultima-hora - últimas 15 noticias etiquetadas "ultima hora"
router.get('/news/ultima-hora', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 15, 30)
  const cacheKey = String(limit)
  const cached = getFromCache(ultimaHoraCache, cacheKey)
  if (cached) {
    return res.json(cached)
  }

  // En modo "RSS en vivo" mantenemos la lógica original (más lenta, va a los RSS).
  if (USE_LIVE_RSS) {
    try {
      const items = await fetchUltimaHoraNews(limit)
      if (items.length > 0) {
        const payload = items.map((i) => ({
          ...i,
          programName: null,
        }))
        setInCache(ultimaHoraCache, cacheKey, payload, ULTIMA_HORA_CACHE_TTL_MS)
        return res.json(payload)
      }
    } catch (err) {
      console.error('Error en /api/news/ultima-hora (RSS ultima-hora):', err.message)
    }
    try {
      const baseItems = await fetchFuentesBaseNews(limit)
      if (baseItems.length > 0) {
        const payload = baseItems.slice(0, limit).map((i) => ({
          ...i,
          programName: null,
        }))
        setInCache(ultimaHoraCache, cacheKey, payload, ULTIMA_HORA_CACHE_TTL_MS)
        return res.json(payload)
      }
    } catch (err) {
      console.error('Error en /api/news/ultima-hora (RSS fuentes-base):', err.message)
    }
    try {
      const items = await fetchAggregatedRtveNews()
      if (items.length > 0) {
        const payload = items.slice(0, limit)
        setInCache(ultimaHoraCache, cacheKey, payload, ULTIMA_HORA_CACHE_TTL_MS)
        return res.json(payload)
      }
    } catch (err) {
      console.error('Error en /api/news/ultima-hora (RTVE):', err.message)
    }
  }

  // Modo rápido (por defecto): tiramos solo de BD, que es rápida y ya está alimentada por el cron.
  try {
    const supabase = getSupabase()
    const { data: rows, error } = await supabase
      .from('news_items')
      .select('id, source_id, title, description, link, image_url, pub_date')
      .order('pub_date', { ascending: false })
      .limit(limit)
    if (error || !rows?.length) return res.json([])
    const sourceIds = [...new Set(rows.map((r) => r.source_id).filter(Boolean))]
    const sourceMap = new Map()
    if (sourceIds.length > 0) {
      const { data: sources } = await supabase.from('news_sources').select('id, name').in('id', sourceIds)
      ;(sources || []).forEach((s) => sourceMap.set(s.id, s.name))
    }
    const payload = rows.map((r) => ({
      title: r.title,
      link: r.link,
      description: r.description || '',
      pubDate: r.pub_date,
      image: r.image_url,
      source: sourceMap.get(r.source_id) ?? null,
      programName: null,
    }))
    setInCache(ultimaHoraCache, cacheKey, payload, ULTIMA_HORA_CACHE_TTL_MS)
    return res.json(payload)
  } catch (dbError) {
    console.error('Fallback BD falló:', dbError.message)
    return res.json([])
  }
})

// GET /api/news/by-region - noticias de fuentes locales por región (madrid, andalucia, etc.)
router.get('/news/by-region', async (req, res) => {
  const regionId = req.query.region || 'madrid'
  const limit = Math.min(Number(req.query.limit) || 30, 50)
  try {
    const items = await fetchNewsByRegion(String(regionId).trim(), limit)
    res.json(
      items.map((i) => ({
        title: i.title,
        link: i.link,
        description: i.description || '',
        pubDate: i.pubDate,
        image: i.image,
        source: i.source,
      }))
    )
  } catch (err) {
    console.error('Error en /api/news/by-region:', err.message)
    res.status(500).json({ error: 'Error al obtener noticias por región' })
  }
})

// GET /api/news/by-category - noticias por categoría (Viajes, Tecnología, Deporte, etc.)
router.get('/news/by-category', async (req, res) => {
  const category = req.query.category || ''
  const limit = Math.min(Number(req.query.limit) || 20, 50)
  if (!category || !String(category).trim()) {
    return res.status(400).json({ error: 'Campo category es obligatorio' })
  }
  try {
    const items = await fetchNewsByCategory(String(category).trim(), limit)
    res.json(items)
  } catch (err) {
    console.error('Error en /api/news/by-category:', err.message)
    res.status(500).json({ error: 'Error al obtener noticias por categoría' })
  }
})

// GET /api/news/rtve - noticias desde fuentes-base (RTVE, El País, etc.)
// Fallback: RTVE API, luego news_items de BD
router.get('/news/rtve', async (req, res) => {
  const limit = Number(req.query.limit) || 20
  try {
    // Prioridad 1: fuentes-base (RSS directos)
    const baseItems = await fetchFuentesBaseNews(limit)
    if (baseItems.length > 0) {
      return res.json(
        baseItems.slice(0, limit).map((i) => ({
          ...i,
          programName: null,
        }))
      )
    }
  } catch (err) {
    console.error('Error en fuentes-base:', err.message)
  }

  try {
    // Prioridad 2: RTVE API
    const items = await fetchAggregatedRtveNews()
    if (items.length > 0) return res.json(items.slice(0, limit))
  } catch (error) {
    console.error('Error en /api/news/rtve (RTVE):', error.message)
  }

  // Prioridad 3: news_items de BD
  try {
    const supabase = getSupabase()
    const { data: rows, error } = await supabase
      .from('news_items')
      .select('id, source_id, title, description, link, image_url, pub_date')
      .order('pub_date', { ascending: false })
      .limit(limit)
    if (error) throw error
    if (!rows?.length) return res.json([])
    const sourceIds = [...new Set(rows.map((r) => r.source_id).filter(Boolean))]
    const sourceMap = new Map()
    if (sourceIds.length > 0) {
      const { data: sources } = await supabase.from('news_sources').select('id, name').in('id', sourceIds)
      ;(sources || []).forEach((s) => sourceMap.set(s.id, s.name))
    }
    const fallback = rows.map((r) => ({
      title: r.title,
      link: r.link,
      description: r.description || '',
      pubDate: r.pub_date,
      image: r.image_url,
      source: sourceMap.get(r.source_id) ?? null,
      programName: null,
    }))
    return res.json(fallback)
  } catch (dbError) {
    console.error('Fallback BD falló:', dbError.message)
    return res.json([])
  }
})

// GET /api/news/by-bias - noticias agrupadas por sesgo (solo usuarios logueados)
router.get('/news/by-bias', authenticateToken, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 15, 50)
  try {
    const byBias = await fetchNewsByBias(limit)
    res.json(byBias)
  } catch (err) {
    console.error('Error en /api/news/by-bias:', err.message)
    res.status(500).json({ error: 'Error al obtener noticias por sesgo' })
  }
})

// GET /api/news/by-bias-matched - misma noticia política en las 3 columnas (comparador)
router.get('/news/by-bias-matched', authenticateToken, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 15, 25)
  try {
    const supabase = getSupabase()
    const { data: snapshot, error } = await supabase
      .from('bias_matched_snapshots')
      .select('payload, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!error && snapshot && snapshot.payload) {
      // Opcionalmente limitamos grupos si el snapshot trae más que el límite actual
      const payload = snapshot.payload
      if (Array.isArray(payload.groups) && payload.groups.length > limit) {
        payload.groups = payload.groups.slice(0, limit)
      }
      return res.json(payload)
    }

    // Fallback: si no hay snapshot aún, calcular en vivo y devolver
    const data = await fetchNewsByBiasMatched(limit)
    await supabase.from('bias_matched_snapshots').insert({ payload: data })
    res.json(data)
  } catch (err) {
    console.error('Error en /api/news/by-bias-matched:', err.message)
    res.status(500).json({ error: 'Error al obtener noticias comparadas' })
  }
})

// POST /api/news/click - registrar clic de usuario en noticia (para métricas)
router.post('/news/click', authenticateToken, async (req, res) => {
  const { source, link } = req.body || {}
  if (!source || typeof source !== 'string') {
    return res.status(400).json({ error: 'Campo source es obligatorio' })
  }
  try {
    const supabase = getSupabase()
    const now = new Date().toISOString()
    await supabase.from('user_news_clicks').insert({
      user_id: req.user.id,
      source_name: String(source).substring(0, 200),
      link: link || null,
      clicked_at: now,
    })
    res.json({ ok: true })
  } catch (err) {
    console.error('Error registrando clic:', err.message)
    res.status(500).json({ error: 'Error al registrar' })
  }
})

// GET /api/news/sources-by-bias - fuentes agrupadas por sesgo (para comparador/admin)
router.get('/news/sources-by-bias', authenticateToken, (req, res) => {
  try {
    const byBias = getSourcesByBias()
    res.json(byBias)
  } catch (err) {
    console.error('Error en /api/news/sources-by-bias:', err.message)
    res.status(500).json({ error: 'Error al obtener fuentes por sesgo' })
  }
})

export default router
