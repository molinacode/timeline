import express from 'express'
import { getSupabase } from '../src/config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

// GET /api/me/saved — listar noticias guardadas del usuario
router.get('/saved', async (req, res) => {
  try {
    const supabase = getSupabase()
    const { data: savedRows, error: savedError } = await supabase
      .from('user_saved_news')
      .select('id, news_id, saved_at, notes')
      .eq('user_id', req.user.id)
      .order('saved_at', { ascending: false })

    if (savedError) throw savedError
    if (!savedRows?.length) return res.json([])

    const newsIds = [...new Set(savedRows.map((r) => r.news_id))]
    const { data: newsRows, error: newsError } = await supabase
      .from('news_items')
      .select('id, source_id, title, description, link, image_url, pub_date')
      .in('id', newsIds)

    if (newsError) throw newsError

    const sourceIds = [...new Set((newsRows || []).map((r) => r.source_id).filter(Boolean))]
    const sourceMap = new Map()
    if (sourceIds.length > 0) {
      const { data: sources } = await supabase
        .from('news_sources')
        .select('id, name')
        .in('id', sourceIds)
      ;(sources || []).forEach((s) => sourceMap.set(s.id, s.name))
    }

    const byNewsId = new Map()
    ;(newsRows || []).forEach((r) => {
      byNewsId.set(r.id, {
        id: r.id,
        title: r.title,
        link: r.link,
        description: r.description || '',
        source: sourceMap.get(r.source_id) || '',
        pubDate: r.pub_date,
        image: r.image_url,
      })
    })

    const list = savedRows
      .map((s) => {
        const news = byNewsId.get(s.news_id)
        if (!news) return null
        return {
          savedId: s.id,
          savedAt: s.saved_at,
          notes: s.notes || null,
          ...news,
        }
      })
      .filter(Boolean)

    res.json(list)
  } catch (error) {
    console.error('Error listando noticias guardadas:', error)
    res.status(500).json({ error: 'Error al obtener noticias guardadas' })
  }
})

// POST /api/me/saved — guardar una noticia
router.post('/saved', async (req, res) => {
  try {
    const { news_id: newsId } = req.body
    if (!newsId) {
      return res.status(400).json({ error: 'Falta news_id' })
    }

    const supabase = getSupabase()
    const { data: existing } = await supabase
      .from('user_saved_news')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('news_id', newsId)
      .maybeSingle()

    if (existing) {
      return res.status(200).json({ ok: true, savedId: existing.id, message: 'Ya estaba guardada' })
    }

    const { data: inserted, error } = await supabase
      .from('user_saved_news')
      .insert({
        user_id: req.user.id,
        news_id: Number(newsId),
        saved_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) throw error
    res.status(201).json({ ok: true, savedId: inserted.id })
  } catch (error) {
    console.error('Error guardando noticia:', error)
    res.status(500).json({ error: 'Error al guardar la noticia' })
  }
})

// DELETE /api/me/saved/:id — quitar de guardadas (id = user_saved_news.id)
router.delete('/saved/:id', async (req, res) => {
  try {
    const id = req.params.id
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('user_saved_news')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select('id')
      .maybeSingle()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'No encontrado' })
    res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Error eliminando noticia guardada:', error)
    res.status(500).json({ error: 'Error al eliminar' })
  }
})

export default router
