import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { getSupabase } from '../src/config/supabase.js'

const router = express.Router()

router.use(authenticateToken)

// GET /api/me/lists — listar listas del usuario (opcional ?withSources=1 para incluir fuentes)
router.get('/lists', async (req, res) => {
  try {
    const supabase = getSupabase()
    const withSources = req.query.withSources === '1' || req.query.withSources === 'true'

    const { data: lists, error: listsError } = await supabase
      .from('source_lists')
      .select('id, name, description, is_public, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false })

    if (listsError) throw listsError

    if (!withSources || !lists?.length) {
      return res.json(
        (lists || []).map((l) => ({
          id: l.id,
          name: l.name,
          description: l.description || null,
          isPublic: !!l.is_public,
          createdAt: l.created_at,
          updatedAt: l.updated_at,
          sources: [],
        }))
      )
    }

    const listIds = lists.map((l) => l.id)
    const { data: items, error: itemsError } = await supabase
      .from('source_list_items')
      .select('id, list_id, source_id, custom_source_id, created_at')
      .in('list_id', listIds)
      .order('created_at', { ascending: true })

    if (itemsError) throw itemsError

    const sourceIds = [...new Set((items || []).map((i) => i.source_id).filter(Boolean))]
    const customIds = [...new Set((items || []).map((i) => i.custom_source_id).filter(Boolean))]

    const sourceMap = new Map()
    if (sourceIds.length > 0) {
      const { data: sources } = await supabase
        .from('news_sources')
        .select('id, name')
        .in('id', sourceIds)
      ;(sources || []).forEach((s) => sourceMap.set(s.id, { id: s.id, name: s.name, type: 'source' }))
    }
    if (customIds.length > 0) {
      const { data: custom } = await supabase
        .from('user_custom_sources')
        .select('id, name')
        .in('id', customIds)
      ;(custom || []).forEach((c) =>
        sourceMap.set(`c${c.id}`, { id: c.id, name: c.name, type: 'custom' })
      )
    }

    const itemsByList = new Map()
    ;(items || []).forEach((it) => {
      if (!itemsByList.has(it.list_id)) itemsByList.set(it.list_id, [])
      const key = it.source_id != null ? it.source_id : `c${it.custom_source_id}`
      const info = sourceMap.get(key)
      itemsByList.get(it.list_id).push({
        id: it.id,
        sourceId: it.source_id ?? null,
        customSourceId: it.custom_source_id ?? null,
        sourceName: info?.name ?? null,
        type: info?.type ?? (it.source_id != null ? 'source' : 'custom'),
        createdAt: it.created_at,
      })
    })

    const result = (lists || []).map((l) => ({
      id: l.id,
      name: l.name,
      description: l.description || null,
      isPublic: !!l.is_public,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
      sources: itemsByList.get(l.id) || [],
    }))

    res.json(result)
  } catch (error) {
    console.error('Error listando listas:', error)
    res.status(500).json({ error: 'Error al obtener tus listas' })
  }
})

// POST /api/me/lists — crear lista
router.post('/lists', async (req, res) => {
  const { name, description, isPublic } = req.body || {}

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      error: 'Datos inválidos',
      message: 'El nombre de la lista es obligatorio',
    })
  }

  try {
    const supabase = getSupabase()
    const now = new Date().toISOString()

    const { data: created, error } = await supabase
      .from('source_lists')
      .insert({
        user_id: req.user.id,
        name: name.trim(),
        description: description != null ? String(description).trim() || null : null,
        is_public: !!isPublic,
        created_at: now,
        updated_at: now,
      })
      .select('id, name, description, is_public, created_at, updated_at')
      .single()

    if (error) throw error

    res.status(201).json({
      id: created.id,
      name: created.name,
      description: created.description || null,
      isPublic: !!created.is_public,
      createdAt: created.created_at,
      updatedAt: created.updated_at,
      sources: [],
    })
  } catch (error) {
    console.error('Error creando lista:', error)
    res.status(500).json({ error: 'Error al crear la lista' })
  }
})

// GET /api/me/lists/:id — una lista con sus fuentes
router.get('/lists/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'ID de lista inválido' })
  }

  try {
    const supabase = getSupabase()

    const { data: list, error: listError } = await supabase
      .from('source_lists')
      .select('id, name, description, is_public, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .maybeSingle()

    if (listError) throw listError
    if (!list) return res.status(404).json({ error: 'Lista no encontrada' })

    const { data: items, error: itemsError } = await supabase
      .from('source_list_items')
      .select('id, list_id, source_id, custom_source_id, created_at')
      .eq('list_id', id)
      .order('created_at', { ascending: true })

    if (itemsError) throw itemsError

    const sourceIds = [...new Set((items || []).map((i) => i.source_id).filter(Boolean))]
    const customIds = [...new Set((items || []).map((i) => i.custom_source_id).filter(Boolean))]

    const sourceMap = new Map()
    if (sourceIds.length > 0) {
      const { data: sources } = await supabase
        .from('news_sources')
        .select('id, name')
        .in('id', sourceIds)
      ;(sources || []).forEach((s) => sourceMap.set(s.id, { id: s.id, name: s.name, type: 'source' }))
    }
    if (customIds.length > 0) {
      const { data: custom } = await supabase
        .from('user_custom_sources')
        .select('id, name')
        .in('id', customIds)
      ;(custom || []).forEach((c) =>
        sourceMap.set(`c${c.id}`, { id: c.id, name: c.name, type: 'custom' })
      )
    }

    const sources = (items || []).map((it) => {
      const key = it.source_id != null ? it.source_id : `c${it.custom_source_id}`
      const info = sourceMap.get(key)
      return {
        id: it.id,
        sourceId: it.source_id ?? null,
        customSourceId: it.custom_source_id ?? null,
        sourceName: info?.name ?? null,
        type: info?.type ?? (it.source_id != null ? 'source' : 'custom'),
        createdAt: it.created_at,
      }
    })

    res.json({
      id: list.id,
      name: list.name,
      description: list.description || null,
      isPublic: !!list.is_public,
      createdAt: list.created_at,
      updatedAt: list.updated_at,
      sources,
    })
  } catch (error) {
    console.error('Error obteniendo lista:', error)
    res.status(500).json({ error: 'Error al obtener la lista' })
  }
})

// PUT /api/me/lists/:id — actualizar lista
router.put('/lists/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'ID de lista inválido' })
  }

  const { name, description, isPublic } = req.body || {}

  try {
    const supabase = getSupabase()

    const { data: existing, error: findError } = await supabase
      .from('source_lists')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .maybeSingle()

    if (findError) throw findError
    if (!existing) return res.status(404).json({ error: 'Lista no encontrada' })

    const updates = { updated_at: new Date().toISOString() }
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'El nombre no puede estar vacío' })
      }
      updates.name = name.trim()
    }
    if (description !== undefined) updates.description = description ? String(description).trim() || null : null
    if (isPublic !== undefined) updates.is_public = !!isPublic

    const { data: updated, error: updateError } = await supabase
      .from('source_lists')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select('id, name, description, is_public, created_at, updated_at')
      .single()

    if (updateError) throw updateError

    res.json({
      id: updated.id,
      name: updated.name,
      description: updated.description || null,
      isPublic: !!updated.is_public,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    })
  } catch (error) {
    console.error('Error actualizando lista:', error)
    res.status(500).json({ error: 'Error al actualizar la lista' })
  }
})

// DELETE /api/me/lists/:id — borrar lista (cascade borra items)
router.delete('/lists/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'ID de lista inválido' })
  }

  try {
    const supabase = getSupabase()

    const { data: deleted, error } = await supabase
      .from('source_lists')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select('id')

    if (error) throw error
    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ error: 'Lista no encontrada' })
    }

    res.status(204).send()
  } catch (error) {
    console.error('Error eliminando lista:', error)
    res.status(500).json({ error: 'Error al eliminar la lista' })
  }
})

// POST /api/me/lists/:id/sources — añadir fuente a la lista (body: sourceId o customSourceId)
router.post('/lists/:id/sources', async (req, res) => {
  const listId = Number(req.params.id)
  if (!Number.isFinite(listId)) {
    return res.status(400).json({ error: 'ID de lista inválido' })
  }

  const { sourceId, customSourceId } = req.body || {}
  const hasSource = sourceId != null && Number.isFinite(Number(sourceId))
  const hasCustom = customSourceId != null && Number.isFinite(Number(customSourceId))

  if (hasSource && hasCustom) {
    return res.status(400).json({ message: 'Indica solo sourceId o solo customSourceId' })
  }
  if (!hasSource && !hasCustom) {
    return res.status(400).json({ message: 'Indica sourceId o customSourceId' })
  }

  try {
    const supabase = getSupabase()

    const { data: list, error: listError } = await supabase
      .from('source_lists')
      .select('id')
      .eq('id', listId)
      .eq('user_id', req.user.id)
      .maybeSingle()

    if (listError) throw listError
    if (!list) return res.status(404).json({ error: 'Lista no encontrada' })

    if (hasCustom) {
      const customId = Number(customSourceId)
      const { data: custom, error: customError } = await supabase
        .from('user_custom_sources')
        .select('id')
        .eq('id', customId)
        .eq('user_id', req.user.id)
        .maybeSingle()

      if (customError) throw customError
      if (!custom) return res.status(404).json({ error: 'Fuente personalizada no encontrada' })

      const { data: existing } = await supabase
        .from('source_list_items')
        .select('id')
        .eq('list_id', listId)
        .eq('custom_source_id', customId)
        .limit(1)
        .maybeSingle()

      if (existing) {
        return res.status(409).json({ message: 'Esta fuente ya está en la lista' })
      }

      const now = new Date().toISOString()
      const { data: item, error: insertError } = await supabase
        .from('source_list_items')
        .insert({
          list_id: listId,
          source_id: null,
          custom_source_id: customId,
          created_at: now,
        })
        .select('id, list_id, source_id, custom_source_id, created_at')
        .single()

      if (insertError) throw insertError

      return res.status(201).json({
        id: item.id,
        sourceId: null,
        customSourceId: item.custom_source_id,
        createdAt: item.created_at,
      })
    }

    const sourceIdNum = Number(sourceId)
    const { data: source, error: sourceError } = await supabase
      .from('news_sources')
      .select('id, name')
      .eq('id', sourceIdNum)
      .maybeSingle()

    if (sourceError) throw sourceError
    if (!source) return res.status(404).json({ error: 'Fuente no encontrada' })

    const { data: existing } = await supabase
      .from('source_list_items')
      .select('id')
      .eq('list_id', listId)
      .eq('source_id', sourceIdNum)
      .limit(1)
      .maybeSingle()

    if (existing) {
      return res.status(409).json({ message: 'Esta fuente ya está en la lista' })
    }

    const now = new Date().toISOString()
    const { data: item, error: insertError } = await supabase
      .from('source_list_items')
      .insert({
        list_id: listId,
        source_id: sourceIdNum,
        custom_source_id: null,
        created_at: now,
      })
      .select('id, list_id, source_id, custom_source_id, created_at')
      .single()

    if (insertError) throw insertError

    res.status(201).json({
      id: item.id,
      sourceId: item.source_id,
      customSourceId: null,
      sourceName: source.name,
      createdAt: item.created_at,
    })
  } catch (error) {
    console.error('Error añadiendo fuente a la lista:', error)
    res.status(500).json({ error: 'Error al añadir la fuente a la lista' })
  }
})

// DELETE /api/me/lists/:id/sources/:itemId — quitar fuente de la lista (por id de source_list_items)
router.delete('/lists/:id/sources/:itemId', async (req, res) => {
  const listId = Number(req.params.id)
  const itemId = Number(req.params.itemId)
  if (!Number.isFinite(listId) || !Number.isFinite(itemId)) {
    return res.status(400).json({ error: 'ID de lista o de elemento inválido' })
  }

  try {
    const supabase = getSupabase()

    const { data: list, error: listError } = await supabase
      .from('source_lists')
      .select('id')
      .eq('id', listId)
      .eq('user_id', req.user.id)
      .maybeSingle()

    if (listError) throw listError
    if (!list) return res.status(404).json({ error: 'Lista no encontrada' })

    const { data: deleted, error } = await supabase
      .from('source_list_items')
      .delete()
      .eq('id', itemId)
      .eq('list_id', listId)
      .select('id')

    if (error) throw error
    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ error: 'Elemento no encontrado en esta lista' })
    }

    res.status(204).send()
  } catch (error) {
    console.error('Error quitando fuente de la lista:', error)
    res.status(500).json({ error: 'Error al quitar la fuente de la lista' })
  }
})

export default router
