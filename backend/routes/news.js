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

// GET /api/news - noticias del timeline (desde news_items, fuentes RSS configuradas)
router.get('/news', async (req, res) => {
  const send = (status, body) => {
    if (res.headersSent) return
    res.status(status).json(body)
  }
  try {
    const supabase = getSupabase()
    const limit = Math.min(Number(req.query.limit) || 50, 200)

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
    send(200, list)
  } catch (error) {
    console.error('Error en /api/news:', error.message, error)
    send(500, { error: 'Error al obtener noticias del timeline' })
  }
})

// GET /api/news/ultima-hora - últimas 15 noticias etiquetadas "ultima hora"
router.get('/news/ultima-hora', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 15, 30)
  try {
    const items = await fetchUltimaHoraNews(limit)
    if (items.length > 0) {
      return res.json(
        items.map((i) => ({
          ...i,
          programName: null,
        }))
      )
    }
  } catch (err) {
    console.error('Error en /api/news/ultima-hora:', err.message)
  }
  try {
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
    console.error('Error en /api/news/ultima-hora (fallback):', err.message)
  }
  try {
    const items = await fetchAggregatedRtveNews()
    if (items.length > 0) return res.json(items.slice(0, limit))
  } catch (err) {
    console.error('Error en /api/news/ultima-hora (RTVE):', err.message)
  }
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
    return res.json(
      rows.map((r) => ({
        title: r.title,
        link: r.link,
        description: r.description || '',
        pubDate: r.pub_date,
        image: r.image_url,
        source: sourceMap.get(r.source_id) ?? null,
        programName: null,
      }))
    )
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
    const data = await fetchNewsByBiasMatched(limit)
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
