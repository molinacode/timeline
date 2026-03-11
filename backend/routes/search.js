import express from 'express'
import { getSupabase } from '../src/config/supabase.js'

const router = express.Router()

// GET /api/search
// Búsqueda simple sobre noticias almacenadas (news_items) con filtros opcionales.
// Parámetros:
//   - q: texto a buscar (título / descripción)
//   - from: ISO date (filtrar pub_date >= from)
//   - to: ISO date (filtrar pub_date <= to)
//   - category: categoría exacta
//   - bias: sesgo de la fuente (left / center / right, etc.)
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').toString().trim()
  const category = (req.query.category || '').toString().trim()
  const from = (req.query.from || '').toString().trim()
  const to = (req.query.to || '').toString().trim()
  const bias = (req.query.bias || '').toString().trim()

  if (!q || q.length < 2) {
    return res.status(400).json({
      error: 'Parámetros inválidos',
      message: 'El parámetro q es obligatorio y debe tener al menos 2 caracteres.',
    })
  }

  try {
    const supabase = getSupabase()
    let query = supabase
      .from('news_items')
      .select('id, source_id, title, description, link, image_url, pub_date, category')
      .order('pub_date', { ascending: false })
      .limit(50)

    // Búsqueda básica en título / descripción
    const pattern = `%${q}%`
    query = query.or(
      `title.ilike.${pattern},description.ilike.${pattern}`
    )

    if (category) {
      query = query.eq('category', category)
    }
    if (from) {
      query = query.gte('pub_date', from)
    }
    if (to) {
      query = query.lte('pub_date', to)
    }

    const { data: rows, error } = await query
    if (error) throw error

    let items = rows || []

    // Filtro opcional por sesgo a partir de la tabla news_sources
    let biasMap = null
    if (bias && items.length > 0) {
      const sourceIds = [...new Set(items.map((r) => r.source_id).filter(Boolean))]
      if (sourceIds.length > 0) {
        const { data: sources, error: sourcesError } = await supabase
          .from('news_sources')
          .select('id, name, bias')
          .in('id', sourceIds)
        if (sourcesError) throw sourcesError
        biasMap = new Map()
        ;(sources || []).forEach((s) => {
          biasMap.set(s.id, { name: s.name, bias: s.bias })
        })
        items = items.filter((r) => {
          const info = biasMap.get(r.source_id)
          if (!info) return false
          if (!info.bias) return false
          return String(info.bias).toLowerCase() === bias.toLowerCase()
        })
      } else {
        items = []
      }
    }

    let sourceInfoMap = new Map()
    if (!biasMap && items.length > 0) {
      const sourceIds = [...new Set(items.map((r) => r.source_id).filter(Boolean))]
      if (sourceIds.length > 0) {
        const { data: sources, error: sourcesError } = await supabase
          .from('news_sources')
          .select('id, name, bias')
          .in('id', sourceIds)
        if (sourcesError) throw sourcesError
        sourceInfoMap = new Map()
        ;(sources || []).forEach((s) => {
          sourceInfoMap.set(s.id, { name: s.name, bias: s.bias })
        })
      }
    } else if (biasMap) {
      sourceInfoMap = biasMap
    }

    const results = items.map((r) => {
      const info = sourceInfoMap.get(r.source_id) || {}
      return {
        id: r.id,
        title: r.title,
        description: r.description || '',
        link: r.link,
        image: r.image_url,
        pubDate: r.pub_date,
        category: r.category || null,
        sourceName: info.name || null,
        bias: info.bias || null,
      }
    })

    res.json({
      q,
      total: results.length,
      items: results,
    })
  } catch (error) {
    console.error('Error en /api/search:', error)
    res.status(500).json({ error: 'Error al buscar noticias' })
  }
})

export default router

