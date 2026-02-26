import express from 'express'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import { getSupabase } from '../src/config/supabase.js'
import { getErrorStats } from '../middleware/errorHandler.js'

const router = express.Router()

router.use(authenticateToken)
router.use(requireAdmin)

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const supabase = getSupabase()
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(
        'id, email, name, region, role, is_active, created_at, last_login, terms_version, terms_accepted_at'
      )
      .order('created_at', { ascending: false })

    if (usersError) throw usersError

    const now = new Date().toISOString()
    const { data: sessionRows } = await supabase
      .from('sessions')
      .select('user_id')
      .gt('expires_at', now)
    const sessionUserIds = [...new Set((sessionRows || []).map((r) => r.user_id))]

    const usersWithStatus = (users || []).map((u) => ({
      ...u,
      is_connected: sessionUserIds.includes(u.id),
      has_accepted_terms: !!u.terms_accepted_at,
    }))

    res.json(usersWithStatus)
  } catch (error) {
    console.error('Error listando usuarios:', error)
    res.status(500).json({ error: 'Error al obtener la lista de usuarios' })
  }
})

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  try {
    const supabase = getSupabase()
    const userId = parseInt(req.params.id, 10)
    const { is_active } = req.body

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuario inválido' })
    }
    if (typeof is_active !== 'number' && typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active debe ser 0 o 1' })
    }

    const { data, error } = await supabase
      .from('users')
      .update({ is_active: !!is_active, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id')

    if (error) throw error
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    res.json({ message: is_active ? 'Usuario activado' : 'Usuario bloqueado' })
  } catch (error) {
    console.error('Error actualizando usuario:', error)
    res.status(500).json({ error: 'Error al actualizar usuario' })
  }
})

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', async (req, res) => {
  try {
    const supabase = getSupabase()
    const userId = parseInt(req.params.id, 10)
    const { role } = req.body

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuario inválido' })
    }
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Rol debe ser user o admin' })
    }

    const { data, error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id')

    if (error) throw error
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    res.json({ message: 'Rol actualizado' })
  } catch (error) {
    console.error('Error actualizando rol:', error)
    res.status(500).json({ error: 'Error al actualizar rol' })
  }
})

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const supabase = getSupabase()
    const userId = parseInt(req.params.id, 10)
    const adminId = req.user.id

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuario inválido' })
    }
    if (userId === adminId) {
      return res.status(403).json({ error: 'No puedes eliminar tu propia cuenta' })
    }

    const { data, error } = await supabase.from('users').delete().eq('id', userId).select('id')
    if (error) throw error
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    res.json({ message: 'Usuario eliminado' })
  } catch (error) {
    console.error('Error eliminando usuario:', error)
    res.status(500).json({ error: 'Error al eliminar usuario' })
  }
})

// GET /api/admin/logs
router.get('/logs', async (req, res) => {
  try {
    const supabase = getSupabase()
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500)

    const [errorsRes, sessionsRes, fetchLogsRes] = await Promise.all([
      supabase.from('error_logs').select('*').order('created_at', { ascending: false }).limit(limit),
      supabase
        .from('sessions')
        .select('id, user_id, created_at, expires_at, users(email, name)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false }),
      supabase
        .from('fetch_logs')
        .select('*, news_sources(name, rss_url)')
        .order('created_at', { ascending: false })
        .limit(limit),
    ])

    const errors = errorsRes.data || []
    const sessions = (sessionsRes.data || []).map((s) => ({
      id: s.id,
      user_id: s.user_id,
      created_at: s.created_at,
      expires_at: s.expires_at,
      email: s.users?.email,
      name: s.users?.name,
    }))
    const fetch_logs = (fetchLogsRes.data || []).map((fl) => ({
      ...fl,
      source_name: fl.news_sources?.name,
      source_rss_url: fl.news_sources?.rss_url,
    }))

    res.json({
      errors,
      sessions,
      fetch_logs,
      server_status: 'ok',
    })
  } catch (error) {
    console.error('Error obteniendo logs:', error)
    res.status(500).json({ error: 'Error al obtener logs' })
  }
})

// GET /api/admin/metrics/clicks
router.get('/metrics/clicks', async (req, res) => {
  try {
    const supabase = getSupabase()
    const { data: clicks } = await supabase
      .from('user_news_clicks')
      .select('user_id, source_name')
    if (!clicks?.length) {
      return res.json({ byUser: [], bySource: [] })
    }

    const userIds = [...new Set(clicks.map((c) => c.user_id))]
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', userIds)
    const userById = new Map((users || []).map((u) => [u.id, u]))

    const countByUserSource = new Map()
    const countBySource = new Map()
    const keySep = '::'
    for (const c of clicks) {
      const key = `${c.user_id}${keySep}${c.source_name}`
      countByUserSource.set(key, (countByUserSource.get(key) || 0) + 1)
      countBySource.set(c.source_name, (countBySource.get(c.source_name) || 0) + 1)
    }

    const byUser = Array.from(countByUserSource.entries()).map(([key, clicksCount]) => {
      const idx = key.indexOf(keySep)
      const uid = Number(idx > 0 ? key.slice(0, idx) : key)
      const source_name = idx > 0 ? key.slice(idx + keySep.length) : ''
      const u = userById.get(uid)
      return {
        user_name: u?.name,
        email: u?.email,
        source_name,
        clicks: clicksCount,
      }
    })
    byUser.sort((a, b) => b.clicks - a.clicks)

    const bySource = Array.from(countBySource.entries()).map(([source_name, total_clicks]) => ({
      source_name,
      total_clicks,
      unique_users: new Set(clicks.filter((c) => c.source_name === source_name).map((c) => c.user_id)).size,
    }))
    bySource.sort((a, b) => b.total_clicks - a.total_clicks)

    res.json({ byUser, bySource })
  } catch (error) {
    console.error('Error obteniendo métricas de clics:', error)
    res.status(500).json({ error: 'Error al obtener métricas' })
  }
})

const DEFAULT_CATEGORIES = [
  { name: 'Viajes', description: 'Noticias de viajes y turismo' },
  { name: 'Tecnología', description: 'Tecnología e innovación' },
  { name: 'Cocina', description: 'Gastronomía y recetas' },
  { name: 'Horóscopo', description: 'Horóscopo y tendencias' },
  { name: 'Deporte', description: 'Deportes y competiciones' },
  { name: 'Política', description: 'Actualidad política' },
  { name: 'Economía', description: 'Economía y finanzas' },
  { name: 'Cultura', description: 'Cultura y espectáculos' },
  { name: 'Sociedad', description: 'Sociedad y estilo de vida' },
]

// GET /api/admin/sources-with-status
router.get('/sources-with-status', async (req, res) => {
  try {
    const supabase = getSupabase()
    const { data: sources, error } = await supabase
      .from('news_sources')
      .select('id, name, rss_url, website_url, category, description, is_active')
      .order('name', { ascending: true })
    if (error) throw error

    const { data: fetchLogs } = await supabase
      .from('fetch_logs')
      .select('source_id, status, error_message, created_at')
      .order('created_at', { ascending: false })

    const lastBySource = new Map()
    for (const fl of fetchLogs || []) {
      if (!lastBySource.has(fl.source_id)) {
        lastBySource.set(fl.source_id, { status: fl.status, error_message: fl.error_message })
      }
    }

    res.json(
      (sources || []).map((s) => ({
        id: s.id,
        name: s.name,
        rssUrl: s.rss_url,
        websiteUrl: s.website_url,
        category: s.category,
        description: s.description,
        isActive: !!s.is_active,
        lastFetchStatus: lastBySource.get(s.id)?.status ?? null,
        lastError: lastBySource.get(s.id)?.error_message ?? null,
      }))
    )
  } catch (error) {
    console.error('Error obteniendo fuentes con estado:', error)
    res.status(500).json({ error: 'Error al obtener fuentes' })
  }
})

// POST /api/admin/categories/seed
router.post('/categories/seed', async (req, res) => {
  try {
    const supabase = getSupabase()
    let created = 0
    for (const c of DEFAULT_CATEGORIES) {
      const { data: existing } = await supabase
        .from('source_categories')
        .select('id')
        .eq('name', c.name)
        .maybeSingle()
      if (!existing) {
        await supabase.from('source_categories').insert({
          name: c.name,
          icon: null,
          color: null,
          description: c.description || null,
          created_at: new Date().toISOString(),
        })
        created++
      }
    }
    res.json({ message: `Categorías creadas: ${created}` })
  } catch (error) {
    console.error('Error sembrando categorías:', error)
    res.status(500).json({ error: 'Error al crear categorías' })
  }
})

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const supabase = getSupabase()
    const errorStats = await getErrorStats()

    const now = new Date().toISOString()
    const [sessionsRes, usersRes] = await Promise.all([
      supabase.from('sessions').select('id', { count: 'exact', head: true }).gt('expires_at', now),
      supabase.from('users').select('id', { count: 'exact', head: true }),
    ])

    res.json({
      ...(errorStats || {}),
      active_sessions: sessionsRes.count ?? 0,
      total_users: usersRes.count ?? 0,
    })
  } catch (error) {
    console.error('Error obteniendo stats:', error)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
})

export default router
