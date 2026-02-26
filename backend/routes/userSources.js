import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { getSupabase } from '../src/config/supabase.js'

const router = express.Router()

router.use(authenticateToken)

// GET /api/me/sources
router.get('/sources', async (req, res) => {
  try {
    const supabase = getSupabase()
    const { data: rows, error } = await supabase
      .from('user_custom_sources')
      .select('id, name, rss_url, category, region, is_active, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(
      (rows || []).map((r) => ({
        id: r.id,
        name: r.name,
        rssUrl: r.rss_url,
        category: r.category,
        region: r.region,
        isActive: !!r.is_active,
        createdAt: r.created_at,
      }))
    )
  } catch (error) {
    console.error('Error listando fuentes del usuario:', error)
    res.status(500).json({ error: 'Error al obtener tus fuentes' })
  }
})

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

function looksIllegalOrAbusiveSource(name, rssUrl) {
  const text = `${name || ''} ${rssUrl || ''}`.toLowerCase()
  return DISALLOWED_SOURCE_PATTERNS.some((kw) => text.includes(kw))
}

// POST /api/me/sources
router.post('/sources', async (req, res) => {
  const supabase = getSupabase()
  const { name, rssUrl, category, region } = req.body || {}

  if (!name || !rssUrl) {
    return res.status(400).json({
      error: 'Datos inválidos',
      message: 'Los campos nombre y URL RSS son obligatorios',
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
      .from('user_custom_sources')
      .insert({
        user_id: req.user.id,
        name: name.trim(),
        rss_url: rssUrl.trim(),
        category: category || null,
        region: region || null,
        is_active: true,
        created_at: now,
        updated_at: now,
      })
      .select('id, name, rss_url, category, region, is_active, created_at')
      .single()

    if (error) throw error
    res.status(201).json({
      id: created.id,
      name: created.name,
      rssUrl: created.rss_url,
      category: created.category,
      region: created.region,
      isActive: true,
      createdAt: created.created_at,
    })
  } catch (error) {
    console.error('Error agregando fuente:', error)
    res.status(500).json({ error: 'Error al agregar la fuente' })
  }
})

// DELETE /api/me/sources/:id
router.delete('/sources/:id', async (req, res) => {
  const supabase = getSupabase()
  const id = Number(req.params.id)

  try {
    const { data: deleted, error } = await supabase
      .from('user_custom_sources')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select('id')
    if (error) throw error
    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ error: 'Fuente no encontrada' })
    }
    res.status(204).send()
  } catch (error) {
    console.error('Error eliminando fuente:', error)
    res.status(500).json({ error: 'Error al eliminar la fuente' })
  }
})

export default router
