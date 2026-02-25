import { getSupabase } from '../src/config/supabase.js'

// =====================================================
// MIDDLEWARE DE LOGGING
// =====================================================

export function logger(req, res, next) {
  const start = Date.now()
  const timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false })

  if (process.env.NODE_ENV === 'development' || req.path.includes('/api/')) {
    const userInfo = req.user ? ` [Usuario: ${req.user.id}]` : ''
    console.log(`📥 ${timestamp} ${req.method.padEnd(6)} ${req.path.padEnd(50)}${userInfo}`)
  }

  const originalSend = res.send
  res.send = function (data) {
    const duration = Date.now() - start
    const status = res.statusCode

    let statusEmoji = '📤'
    if (status >= 200 && status < 300) statusEmoji = '✅'
    else if (status >= 300 && status < 400) statusEmoji = '🔄'
    else if (status >= 400 && status < 500) statusEmoji = '⚠️'
    else if (status >= 500) statusEmoji = '❌'

    if (status >= 400 || process.env.NODE_ENV === 'development') {
      const errorMsg = status >= 400 && typeof data === 'string'
        ? data.substring(0, 100)
        : status >= 400 && typeof data === 'object'
        ? JSON.stringify(data).substring(0, 100)
        : ''

      console.log(
        `${statusEmoji} ${timestamp} ${req.method.padEnd(6)} ${req.path.padEnd(50)} ${status} ${duration}ms${errorMsg ? ' - ' + errorMsg : ''}`
      )
    }

    if (status >= 400) {
      logError(req, res, data, duration)
    }

    originalSend.call(this, data)
  }

  next()
}

// =====================================================
// FUNCIÓN PARA LOGGEAR ERRORES EN BASE DE DATOS
// =====================================================

async function logErrorToDb(req, res, responseData, duration) {
  try {
    const supabase = getSupabase()
    const now = new Date().toISOString()
    const errorMessage =
      typeof responseData === 'string'
        ? responseData.substring(0, 1000)
        : JSON.stringify(responseData).substring(0, 1000)

    await supabase.from('error_logs').insert({
      method: req.method,
      path: req.path,
      status_code: res.statusCode,
      error_message: errorMessage,
      user_agent: req.get('User-Agent') || 'Unknown',
      ip_address: req.ip,
      duration_ms: duration,
      created_at: now,
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error al loggear en base de datos:', error.message)
    }
  }
}

function logError(req, res, responseData, duration) {
  logErrorToDb(req, res, responseData, duration).catch(() => {})
}

// =====================================================
// MIDDLEWARE DE MANEJO DE ERRORES
// =====================================================

export function errorHandler(error, req, res, next) {
  console.error('🚨 Error capturado:', error)

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      message: error.message,
      details: error.details || null,
    })
  }

  if (error.code && (error.code.startsWith('SQLITE_') || error.code === 'PGRST')) {
    console.error('Error de base de datos:', error)
    return res.status(500).json({
      error: 'Error de base de datos',
      message:
        'Ha ocurrido un error interno. Por favor, intenta de nuevo más tarde.',
    })
  }

  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      message: 'El token de autorización no es válido',
    })
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      message: 'El token de autorización ha expirado',
    })
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'JSON inválido',
      message: 'El formato JSON enviado no es válido',
    })
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Archivo demasiado grande',
      message: 'El archivo enviado excede el tamaño máximo permitido',
    })
  }

  if (error.status === 429) {
    return res.status(429).json({
      error: 'Demasiadas solicitudes',
      message: error.message || 'Has excedido el límite de solicitudes',
    })
  }

  const statusCode = error.statusCode || error.status || 500
  const message = error.message || 'Error interno del servidor'

  res.status(statusCode).json({
    error: 'Error interno del servidor',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Ha ocurrido un error interno. Por favor, intenta de nuevo más tarde.'
        : message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error,
    }),
  })
}

// =====================================================
// MIDDLEWARE PARA MANEJAR RUTAS NO ENCONTRADAS
// =====================================================

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.method} ${req.path} no existe`,
    availableRoutes: [
      'GET /health',
      'GET /api',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/news',
      'GET /api/sources',
      'GET /api/users/profile',
    ],
  })
}

// =====================================================
// MIDDLEWARE DE SEGURIDAD ADICIONAL
// =====================================================

export function securityHeaders(req, res, next) {
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "script-src 'self'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self'; " +
      "connect-src 'self';"
  )
  next()
}

// =====================================================
// MIDDLEWARE DE COMPRESIÓN (OPCIONAL)
// =====================================================

export function compression(req, res, next) {
  if (
    req.accepts('gzip') &&
    (req.path.startsWith('/api') || req.path === '/health')
  ) {
    const originalSend = res.send
    res.send = function (data) {
      res.setHeader('Content-Encoding', 'gzip')
      originalSend.call(this, data)
    }
  }
  next()
}

// =====================================================
// FUNCIÓN PARA OBTENER ESTADÍSTICAS DE ERRORES
// =====================================================

export async function getErrorStats() {
  try {
    const supabase = getSupabase()
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    const [totalRes, last24hRes, byStatusRes, byPathRes] = await Promise.all([
      supabase.from('error_logs').select('id', { count: 'exact', head: true }),
      supabase
        .from('error_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', last24h),
      supabase
        .from('error_logs')
        .select('status_code')
        .then((r) => {
          if (r.error) return { data: [] }
          const byCode = (r.data || []).reduce((acc, row) => {
            acc[row.status_code] = (acc[row.status_code] || 0) + 1
            return acc
          }, {})
          return { data: Object.entries(byCode).map(([status_code, count]) => ({ status_code: Number(status_code), count })) }
        }),
      supabase
        .from('error_logs')
        .select('path')
        .limit(1000)
        .then((r) => {
          if (r.error) return { data: [] }
          const byPath = (r.data || []).reduce((acc, row) => {
            acc[row.path] = (acc[row.path] || 0) + 1
            return acc
          }, {})
          return {
            data: Object.entries(byPath)
              .map(([path, count]) => ({ path, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 10),
          }
        }),
    ])

    return {
      total_errors: totalRes.count ?? 0,
      errors_last_24h: last24hRes.count ?? 0,
      errors_by_status: byStatusRes.data || [],
      most_common_errors: byPathRes.data || [],
    }
  } catch (error) {
    console.error('Error al obtener estadísticas de errores:', error)
    return null
  }
}

// =====================================================
// FUNCIÓN PARA LIMPIAR LOGS ANTIGUOS
// =====================================================

export async function cleanupOldLogs() {
  try {
    const supabase = getSupabase()
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: deleted, error } = await supabase
      .from('error_logs')
      .delete()
      .lt('created_at', cutoff)
      .select('id')

    if (error) throw error
    const count = deleted?.length ?? 0
    console.log(`🧹 Limpiados ${count} logs de errores antiguos`)
    return count
  } catch (error) {
    console.error('Error al limpiar logs antiguos:', error)
    return 0
  }
}

export default {
  logger,
  errorHandler,
  notFoundHandler,
  securityHeaders,
  compression,
  getErrorStats,
  cleanupOldLogs,
}
