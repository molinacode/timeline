import { getDatabase } from '../config/database.js';

// =====================================================
// MIDDLEWARE DE LOGGING
// =====================================================

export function logger(req, res, next) {
    const start = Date.now();
    const timestamp = new Date().toISOString();
    
    // Log de la request
    console.log(`📥 ${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
    
    // Interceptar la respuesta para loggear
    const originalSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - start;
        const status = res.statusCode;
        
        // Determinar emoji según el status code
        let statusEmoji = '📤';
        if (status >= 200 && status < 300) statusEmoji = '✅';
        else if (status >= 300 && status < 400) statusEmoji = '🔄';
        else if (status >= 400 && status < 500) statusEmoji = '⚠️';
        else if (status >= 500) statusEmoji = '❌';
        
        console.log(`${statusEmoji} ${timestamp} - ${req.method} ${req.path} - ${status} - ${duration}ms`);
        
        // Log de errores en base de datos si es necesario
        if (status >= 400) {
            logError(req, res, data, duration);
        }
        
        originalSend.call(this, data);
    };
    
    next();
}

// =====================================================
// FUNCIÓN PARA LOGGEAR ERRORES EN BASE DE DATOS
// =====================================================

function logError(req, res, responseData, duration) {
    try {
        const db = getDatabase();
        
        db.prepare(`
            INSERT INTO error_logs (
                method, path, status_code, error_message, 
                user_agent, ip_address, duration_ms, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(
            req.method,
            req.path,
            res.statusCode,
            typeof responseData === 'string' ? responseData : JSON.stringify(responseData),
            req.get('User-Agent') || 'Unknown',
            req.ip,
            duration
        );
    } catch (error) {
        console.error('Error al loggear en base de datos:', error);
    }
}

// =====================================================
// MIDDLEWARE DE MANEJO DE ERRORES
// =====================================================

export function errorHandler(error, req, res, next) {
    console.error('🚨 Error capturado:', error);
    
    // Error de validación
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Error de validación',
            message: error.message,
            details: error.details || null
        });
    }
    
    // Error de base de datos
    if (error.code && error.code.startsWith('SQLITE_')) {
        console.error('Error de base de datos:', error);
        return res.status(500).json({
            error: 'Error de base de datos',
            message: 'Ha ocurrido un error interno. Por favor, intenta de nuevo más tarde.'
        });
    }
    
    // Error de JWT
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Token inválido',
            message: 'El token de autorización no es válido'
        });
    }
    
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expirado',
            message: 'El token de autorización ha expirado'
        });
    }
    
    // Error de sintaxis JSON
    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: 'JSON inválido',
            message: 'El formato JSON enviado no es válido'
        });
    }
    
    // Error de límite de tamaño
    if (error.type === 'entity.too.large') {
        return res.status(413).json({
            error: 'Archivo demasiado grande',
            message: 'El archivo enviado excede el tamaño máximo permitido'
        });
    }
    
    // Error de rate limiting
    if (error.status === 429) {
        return res.status(429).json({
            error: 'Demasiadas solicitudes',
            message: error.message || 'Has excedido el límite de solicitudes'
        });
    }
    
    // Error genérico del servidor
    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || 'Error interno del servidor';
    
    res.status(statusCode).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'production' 
            ? 'Ha ocurrido un error interno. Por favor, intenta de nuevo más tarde.'
            : message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
            details: error
        })
    });
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
            'GET /api/users/profile'
        ]
    });
}

// =====================================================
// MIDDLEWARE DE SEGURIDAD ADICIONAL
// =====================================================

export function securityHeaders(req, res, next) {
    // Prevenir clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevenir MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Habilitar XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Content Security Policy básico
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self'; " +
        "connect-src 'self';"
    );
    
    next();
}

// =====================================================
// MIDDLEWARE DE COMPRESIÓN (OPCIONAL)
// =====================================================

export function compression(req, res, next) {
    // Solo comprimir respuestas JSON y texto
    if (req.accepts('gzip') && 
        (req.path.startsWith('/api') || req.path === '/health')) {
        
        const originalSend = res.send;
        res.send = function(data) {
            // Aquí podrías implementar compresión gzip
            // Por simplicidad, solo agregamos el header
            res.setHeader('Content-Encoding', 'gzip');
            originalSend.call(this, data);
        };
    }
    
    next();
}

// =====================================================
// FUNCIÓN PARA OBTENER ESTADÍSTICAS DE ERRORES
// =====================================================

export function getErrorStats() {
    try {
        const db = getDatabase();
        
        const stats = {
            total_errors: db.prepare('SELECT COUNT(*) as count FROM error_logs').get().count,
            errors_last_24h: db.prepare(`
                SELECT COUNT(*) as count 
                FROM error_logs 
                WHERE created_at >= datetime('now', '-24 hours')
            `).get().count,
            errors_by_status: db.prepare(`
                SELECT status_code, COUNT(*) as count 
                FROM error_logs 
                GROUP BY status_code 
                ORDER BY count DESC
            `).all(),
            most_common_errors: db.prepare(`
                SELECT path, COUNT(*) as count 
                FROM error_logs 
                GROUP BY path 
                ORDER BY count DESC 
                LIMIT 10
            `).all()
        };
        
        return stats;
    } catch (error) {
        console.error('Error al obtener estadísticas de errores:', error);
        return null;
    }
}

// =====================================================
// FUNCIÓN PARA LIMPIAR LOGS ANTIGUOS
// =====================================================

export function cleanupOldLogs() {
    try {
        const db = getDatabase();
        
        // Limpiar logs de errores más antiguos de 30 días
        const result = db.prepare(`
            DELETE FROM error_logs 
            WHERE created_at < datetime('now', '-30 days')
        `).run();
        
        console.log(`🧹 Limpiados ${result.changes} logs de errores antiguos`);
        return result.changes;
    } catch (error) {
        console.error('Error al limpiar logs antiguos:', error);
        return 0;
    }
}

export default {
    logger,
    errorHandler,
    notFoundHandler,
    securityHeaders,
    compression,
    getErrorStats,
    cleanupOldLogs
};
