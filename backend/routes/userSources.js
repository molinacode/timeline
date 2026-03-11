import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { getSupabase } from '../src/config/supabase.js'

const router = express.Router()

router.use(authenticateToken)

// GET /api/me/interests - obtener intereses (categorías) del usuario desde user_preferences
router.get('/interests', async (req, res) => {
  try {
    const supabase = getSupabase()
    const { data: row, error } = await supabase
      .from('user_preferences')
      .select('id, categories')
      .eq('user_id', req.user.id)
      .limit(1)
      .maybeSingle()

    if (error) throw error

    let categories = []
    if (row && row.categories) {
      try {
        const parsed = JSON.parse(row.categories)
        if (Array.isArray(parsed)) {
          categories = parsed
            .map((c) => (typeof c === 'string' ? c.trim() : String(c || '').trim()))
            .filter((c) => c.length > 0)
        }
      } catch {
        // Si el JSON está corrupto, devolvemos lista vacía
        categories = []
      }
    }

    res.json({ categories })
  } catch (error) {
    console.error('Error obteniendo intereses del usuario:', error)
    res.status(500).json({ error: 'Error al obtener tus intereses' })
  }
})

// PUT /api/me/interests - guardar intereses (categorías) del usuario en user_preferences
router.put('/interests', async (req, res) => {
  const { categories } = req.body || {}

  if (!Array.isArray(categories)) {
    return res.status(400).json({
      error: 'Datos inválidos',
      message: 'El campo categories debe ser un array de strings',
    })
  }

  const normalizedCategories = categories
    .map((c) => (typeof c === 'string' ? c.trim() : String(c || '').trim()))
    .filter((c) => c.length > 0)

  try {
    const supabase = getSupabase()
    const now = new Date().toISOString()

    // ¿Ya existe fila de preferencias para este usuario?
    const { data: existing, error: selectError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', req.user.id)
      .limit(1)
      .maybeSingle()

    if (selectError) throw selectError

    if (existing && existing.id) {
      const { error: updateError } = await supabase
        .from('user_preferences')
        .update({
          categories: JSON.stringify(normalizedCategories),
          updated_at: now,
        })
        .eq('id', existing.id)

      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabase.from('user_preferences').insert({
        user_id: req.user.id,
        categories: JSON.stringify(normalizedCategories),
        created_at: now,
        updated_at: now,
      })

      if (insertError) throw insertError
    }

    res.json({ categories: normalizedCategories })
  } catch (error) {
    console.error('Error guardando intereses del usuario:', error)
    res.status(500).json({ error: 'Error al guardar tus intereses' })
  }
})

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
