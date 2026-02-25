import jwt from 'jsonwebtoken'
import { getSupabase } from '../src/config/supabase.js'

// =====================================================
// MIDDLEWARE DE AUTENTICACIÓN
// =====================================================

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Token de acceso requerido',
        message: 'Debes proporcionar un token de autorización',
      })
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'timeline-secret-key'
    )

    const supabase = getSupabase()
    const now = new Date().toISOString()
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, users(*)')
      .eq('token', token)
      .gt('expires_at', now)
      .maybeSingle()

    if (sessionError || !session) {
      return res.status(401).json({
        error: 'Token inválido o expirado',
        message: 'La sesión ha expirado o no es válida',
      })
    }

    const user = session.users
    if (!user || !user.is_active) {
      return res.status(403).json({
        error: 'Usuario desactivado',
        message: 'Tu cuenta ha sido desactivada',
      })
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      region: user.region,
      role: user.role || 'user',
    }

    next()
  } catch (error) {
    console.error('Error en autenticación:', error)

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El token proporcionado no es válido',
      })
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'El token ha expirado, por favor inicia sesión nuevamente',
      })
    }

    return res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al verificar la autenticación',
    })
  }
}

// =====================================================
// MIDDLEWARE OPCIONAL DE AUTENTICACIÓN
// =====================================================

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      req.user = null
      return next()
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'timeline-secret-key'
    )

    const supabase = getSupabase()
    const now = new Date().toISOString()
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*, users(*)')
      .eq('token', token)
      .gt('expires_at', now)
      .maybeSingle()

    const user = session?.users
    if (session && user && user.is_active) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        region: user.region,
        role: user.role || 'user',
      }
    } else {
      req.user = null
    }

    next()
  } catch (error) {
    req.user = null
    next()
  }
}

// =====================================================
// MIDDLEWARE DE AUTORIZACIÓN POR REGIÓN
// =====================================================

export function requireRegion(requiredRegion) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Autenticación requerida',
        message: 'Debes estar autenticado para acceder a este recurso',
      })
    }

    if (req.user.region !== requiredRegion) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: `Este recurso solo está disponible para usuarios de ${requiredRegion}`,
      })
    }

    next()
  }
}

// =====================================================
// MIDDLEWARE DE VALIDACIÓN DE ADMINISTRADOR
// =====================================================

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Autenticación requerida',
      message: 'Debes estar autenticado para acceder a este recurso',
    })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Esta operación requiere permisos de administrador',
    })
  }

  next()
}

// =====================================================
// MIDDLEWARE DE RATE LIMITING POR USUARIO
// =====================================================

export function userRateLimit(windowMs = 15 * 60 * 1000, max = 100) {
  const requests = new Map()

  return (req, res, next) => {
    if (!req.user) {
      return next()
    }

    const userId = req.user.id
    const now = Date.now()
    const windowStart = now - windowMs

    if (requests.has(userId)) {
      const userRequests = requests.get(userId)
      const validRequests = userRequests.filter((time) => time > windowStart)
      requests.set(userId, validRequests)
    } else {
      requests.set(userId, [])
    }

    const userRequests = requests.get(userId)

    if (userRequests.length >= max) {
      return res.status(429).json({
        error: 'Límite de solicitudes excedido',
        message: `Has excedido el límite de ${max} solicitudes por ${
          windowMs / 1000 / 60
        } minutos`,
        retryAfter: Math.ceil(windowMs / 1000),
      })
    }

    userRequests.push(now)
    next()
  }
}

// =====================================================
// FUNCIÓN PARA LIMPIAR SESIONES EXPIRADAS
// =====================================================

export async function cleanupExpiredSessions() {
  try {
    const supabase = getSupabase()
    const now = new Date().toISOString()
    const { data: deleted, error } = await supabase
      .from('sessions')
      .delete()
      .lt('expires_at', now)
      .select('id')

    if (error) throw error
    const count = deleted?.length ?? 0
    console.log(`🧹 Limpiadas ${count} sesiones expiradas`)
    return count
  } catch (error) {
    console.error('Error al limpiar sesiones expiradas:', error)
    return 0
  }
}

// =====================================================
// FUNCIÓN PARA OBTENER ESTADÍSTICAS DE SESIONES
// =====================================================

export async function getSessionStats() {
  try {
    const supabase = getSupabase()
    const now = new Date().toISOString()

    const [totalRes, activeRes, expiredRes] = await Promise.all([
      supabase.from('sessions').select('id', { count: 'exact', head: true }),
      supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .gt('expires_at', now),
      supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .lte('expires_at', now),
    ])

    return {
      total_sessions: totalRes.count ?? 0,
      active_sessions: activeRes.count ?? 0,
      expired_sessions: expiredRes.count ?? 0,
    }
  } catch (error) {
    console.error('Error al obtener estadísticas de sesiones:', error)
    return null
  }
}

export default {
  authenticateToken,
  optionalAuth,
  requireRegion,
  requireAdmin,
  userRateLimit,
  cleanupExpiredSessions,
  getSessionStats,
}
