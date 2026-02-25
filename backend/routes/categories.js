import express from 'express'
import { getSupabase } from '../src/config/supabase.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// GET /api/categories
router.get('/categories', authenticateToken, async (req, res) => {
  const supabase = getSupabase()
  try {
    const { data: rows, error } = await supabase
      .from('source_categories')
      .select('id, name, icon, color, description, created_at')
      .order('name', { ascending: true })

    if (error) throw error
    res.json(
      (rows || []).map((r) => ({
        id: r.id,
        name: r.name,
        icon: r.icon,
        color: r.color,
        description: r.description,
        createdAt: r.created_at,
      }))
    )
  } catch (error) {
    console.error('Error listando categorías:', error)
    res.status(500).json({ error: 'Error al listar categorías' })
  }
})

// POST /api/categories (admin)
router.post('/categories', authenticateToken, requireAdmin, async (req, res) => {
  const supabase = getSupabase()
  const { name, icon, color, description } = req.body || {}

  if (!name) {
    return res.status(400).json({
      error: 'Datos inválidos',
      message: 'El campo name es obligatorio',
    })
  }

  try {
    const now = new Date().toISOString()
    const { data: created, error } = await supabase
      .from('source_categories')
      .insert({
        name,
        icon: icon || null,
        color: color || null,
        description: description || null,
        created_at: now,
      })
      .select('id, name, icon, color, description, created_at')
      .single()

    if (error) throw error
    res.status(201).json({
      id: created.id,
      name: created.name,
      icon: created.icon,
      color: created.color,
      description: created.description,
      createdAt: created.created_at,
    })
  } catch (error) {
    console.error('Error creando categoría:', error)
    res.status(500).json({ error: 'Error al crear categoría' })
  }
})

// PUT /api/categories/:id (admin)
router.put('/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  const supabase = getSupabase()
  const id = Number(req.params.id)
  const { name, icon, color, description } = req.body || {}

  try {
    const { data: existing, error: findErr } = await supabase
      .from('source_categories')
      .select('id')
      .eq('id', id)
      .maybeSingle()
    if (findErr || !existing) {
      return res.status(404).json({ error: 'Categoría no encontrada' })
    }

    const updates = {}
    if (name != null) updates.name = name
    if (icon != null) updates.icon = icon
    if (color != null) updates.color = color
    if (description != null) updates.description = description

    if (Object.keys(updates).length === 0) {
      const { data: current } = await supabase
        .from('source_categories')
        .select('id, name, icon, color, description, created_at')
        .eq('id', id)
        .single()
      return res.json({
        id: current.id,
        name: current.name,
        icon: current.icon,
        color: current.color,
        description: current.description,
        createdAt: current.created_at,
      })
    }

    const { data: updated, error: updateErr } = await supabase
      .from('source_categories')
      .update(updates)
      .eq('id', id)
      .select('id, name, icon, color, description, created_at')
      .single()

    if (updateErr) throw updateErr
    res.json({
      id: updated.id,
      name: updated.name,
      icon: updated.icon,
      color: updated.color,
      description: updated.description,
      createdAt: updated.created_at,
    })
  } catch (error) {
    console.error('Error actualizando categoría:', error)
    res.status(500).json({ error: 'Error al actualizar categoría' })
  }
})

// DELETE /api/categories/:id (admin)
router.delete('/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  const supabase = getSupabase()
  const id = Number(req.params.id)

  try {
    const { data: deleted, error } = await supabase
      .from('source_categories')
      .delete()
      .eq('id', id)
      .select('id')
    if (error) throw error
    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' })
    }
    res.status(204).send()
  } catch (error) {
    console.error('Error eliminando categoría:', error)
    res.status(500).json({ error: 'Error al eliminar categoría' })
  }
})

export default router
