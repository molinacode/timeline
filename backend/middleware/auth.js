import jwt from 'jsonwebtoken';
import { getDatabase } from '../config/database.js';

// =====================================================
// MIDDLEWARE DE AUTENTICACIÓN
// =====================================================

export function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: 'Token de acceso requerido',
                message: 'Debes proporcionar un token de autorización'
            });
        }

        // Verificar token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'timeline-secret-key'
        );

        // Verificar que la sesión existe y no ha expirado
        const db = getDatabase();
        const session = db.prepare(`
            SELECT s.*, u.id, u.email, u.name, u.region, u.is_active
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ? AND s.expires_at > datetime('now')
        `).get(token);

        if (!session) {
            return res.status(401).json({
                error: 'Token inválido o expirado',
                message: 'La sesión ha expirado o no es válida'
            });
        }

        if (!session.is_active) {
            return res.status(403).json({
                error: 'Usuario desactivado',
                message: 'Tu cuenta ha sido desactivada'
            });
        }

        // Agregar información del usuario a la request
        req.user = {
            id: session.id,
            email: session.email,
            name: session.name,
            region: session.region
        };

        next();

    } catch (error) {
        console.error('Error en autenticación:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Token inválido',
                message: 'El token proporcionado no es válido'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expirado',
                message: 'El token ha expirado, por favor inicia sesión nuevamente'
            });
        }

        return res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error al verificar la autenticación'
        });
    }
}

// =====================================================
// MIDDLEWARE OPCIONAL DE AUTENTICACIÓN
// =====================================================

export function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'timeline-secret-key'
        );

        const db = getDatabase();
        const session = db.prepare(`
            SELECT s.*, u.id, u.email, u.name, u.region, u.is_active
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ? AND s.expires_at > datetime('now')
        `).get(token);

        if (session && session.is_active) {
            req.user = {
                id: session.id,
                email: session.email,
                name: session.name,
                region: session.region
            };
        } else {
            req.user = null;
        }

        next();

    } catch (error) {
        // En caso de error, continuar sin usuario autenticado
        req.user = null;
        next();
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
                message: 'Debes estar autenticado para acceder a este recurso'
            });
        }

        if (req.user.region !== requiredRegion) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: `Este recurso solo está disponible para usuarios de ${requiredRegion}`
            });
        }

        next();
    };
}

// =====================================================
// MIDDLEWARE DE VALIDACIÓN DE ADMINISTRADOR
// =====================================================

export function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            error: 'Autenticación requerida',
            message: 'Debes estar autenticado para acceder a este recurso'
        });
    }

    // Por ahora, todos los usuarios autenticados son considerados administradores
    // En una implementación real, tendrías una columna 'role' en la tabla users
    next();
}

// =====================================================
// MIDDLEWARE DE RATE LIMITING POR USUARIO
// =====================================================

export function userRateLimit(windowMs = 15 * 60 * 1000, max = 100) {
    const requests = new Map();

    return (req, res, next) => {
        if (!req.user) {
            return next();
        }

        const userId = req.user.id;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Limpiar requests antiguos
        if (requests.has(userId)) {
            const userRequests = requests.get(userId);
            const validRequests = userRequests.filter(time => time > windowStart);
            requests.set(userId, validRequests);
        } else {
            requests.set(userId, []);
        }

        const userRequests = requests.get(userId);

        if (userRequests.length >= max) {
            return res.status(429).json({
                error: 'Límite de solicitudes excedido',
                message: `Has excedido el límite de ${max} solicitudes por ${windowMs / 1000 / 60} minutos`,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        userRequests.push(now);
        next();
    };
}

// =====================================================
// FUNCIÓN PARA LIMPIAR SESIONES EXPIRADAS
// =====================================================

export function cleanupExpiredSessions() {
    try {
        const db = getDatabase();
        const result = db.prepare(`
            DELETE FROM sessions 
            WHERE expires_at < datetime('now')
        `).run();

        console.log(`🧹 Limpiadas ${result.changes} sesiones expiradas`);
        return result.changes;
    } catch (error) {
        console.error('Error al limpiar sesiones expiradas:', error);
        return 0;
    }
}

// =====================================================
// FUNCIÓN PARA OBTENER ESTADÍSTICAS DE SESIONES
// =====================================================

export function getSessionStats() {
    try {
        const db = getDatabase();
        
        const stats = {
            total_sessions: db.prepare('SELECT COUNT(*) as count FROM sessions').get().count,
            active_sessions: db.prepare(`
                SELECT COUNT(*) as count 
                FROM sessions 
                WHERE expires_at > datetime('now')
            `).get().count,
            expired_sessions: db.prepare(`
                SELECT COUNT(*) as count 
                FROM sessions 
                WHERE expires_at <= datetime('now')
            `).get().count
        };

        return stats;
    } catch (error) {
        console.error('Error al obtener estadísticas de sesiones:', error);
        return null;
    }
}

export default {
    authenticateToken,
    optionalAuth,
    requireRegion,
    requireAdmin,
    userRateLimit,
    cleanupExpiredSessions,
    getSessionStats
};
