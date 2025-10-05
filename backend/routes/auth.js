import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../config/database.js';

const router = express.Router();

// =====================================================
// MIDDLEWARE DE VALIDACIÓN
// =====================================================

const validateRegister = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email válido requerido'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('region')
        .optional()
        .isIn(['andalucia', 'aragon', 'asturias', 'baleares', 'canarias', 'cantabria', 'castilla', 'cataluna', 'castillaleon', 'paisvasco', 'navarra', 'murcia', 'madrid', 'rioja', 'galicia', 'extremadura', 'ceutamelilla', 'valencia'])
        .withMessage('Región no válida')
];

const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email válido requerido'),
    body('password')
        .notEmpty()
        .withMessage('Contraseña requerida')
];

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function generateToken(userId) {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'timeline-secret-key',
        { expiresIn: '7d' }
    );
}

function generateRefreshToken(userId) {
    return jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || 'timeline-refresh-secret',
        { expiresIn: '30d' }
    );
}

// =====================================================
// RUTAS DE AUTENTICACIÓN
// =====================================================

// POST /api/auth/register - Registro de usuario
router.post('/register', validateRegister, async (req, res) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const { email, password, name, region } = req.body;
        const db = getDatabase();

        // Verificar si el usuario ya existe
        const existingUser = db.prepare(`
            SELECT id FROM users WHERE email = ?
        `).get(email);

        if (existingUser) {
            return res.status(409).json({
                error: 'Usuario ya existe',
                message: 'Ya existe un usuario con este email'
            });
        }

        // Hash de la contraseña
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Crear usuario
        const result = db.prepare(`
            INSERT INTO users (email, password_hash, name, region, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        `).run(email, passwordHash, name || null, region || null);

        const userId = result.lastInsertRowid;

        // Crear preferencias por defecto
        db.prepare(`
            INSERT INTO user_preferences (user_id, theme, language, region, notifications)
            VALUES (?, 'light', 'es', ?, TRUE)
        `).run(userId, region || null);

        // Generar tokens
        const token = generateToken(userId);
        const refreshToken = generateRefreshToken(userId);

        // Guardar sesión
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

        db.prepare(`
            INSERT INTO sessions (user_id, token, expires_at)
            VALUES (?, ?, ?)
        `).run(userId, token, expiresAt.toISOString());

        // Respuesta exitosa
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: {
                id: userId,
                email,
                name: name || null,
                region: region || null
            },
            token,
            refreshToken,
            expiresAt: expiresAt.toISOString()
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo registrar el usuario'
        });
    }
});

// POST /api/auth/login - Inicio de sesión
router.post('/login', validateLogin, async (req, res) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const { email, password } = req.body;
        const db = getDatabase();

        // Buscar usuario
        const user = db.prepare(`
            SELECT id, email, password_hash, name, region, is_active, last_login
            FROM users WHERE email = ?
        `).get(email);

        if (!user) {
            return res.status(401).json({
                error: 'Credenciales inválidas',
                message: 'Email o contraseña incorrectos'
            });
        }

        // Verificar si el usuario está activo
        if (!user.is_active) {
            return res.status(403).json({
                error: 'Cuenta desactivada',
                message: 'Tu cuenta ha sido desactivada'
            });
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Credenciales inválidas',
                message: 'Email o contraseña incorrectos'
            });
        }

        // Generar tokens
        const token = generateToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Guardar sesión
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

        db.prepare(`
            INSERT INTO sessions (user_id, token, expires_at)
            VALUES (?, ?, ?)
        `).run(user.id, token, expiresAt.toISOString());

        // Actualizar último login
        db.prepare(`
            UPDATE users 
            SET last_login = datetime('now'), updated_at = datetime('now')
            WHERE id = ?
        `).run(user.id);

        // Respuesta exitosa
        res.json({
            message: 'Inicio de sesión exitoso',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                region: user.region
            },
            token,
            refreshToken,
            expiresAt: expiresAt.toISOString()
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo iniciar sesión'
        });
    }
});

// POST /api/auth/refresh - Renovar token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                error: 'Token de renovación requerido'
            });
        }

        // Verificar refresh token
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET || 'timeline-refresh-secret'
        );

        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                error: 'Token de renovación inválido'
            });
        }

        const db = getDatabase();
        const user = db.prepare(`
            SELECT id, email, name, region, is_active
            FROM users WHERE id = ?
        `).get(decoded.userId);

        if (!user || !user.is_active) {
            return res.status(401).json({
                error: 'Usuario no válido'
            });
        }

        // Generar nuevo token
        const newToken = generateToken(user.id);
        const newRefreshToken = generateRefreshToken(user.id);

        // Guardar nueva sesión
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        db.prepare(`
            INSERT INTO sessions (user_id, token, expires_at)
            VALUES (?, ?, ?)
        `).run(user.id, newToken, expiresAt.toISOString());

        res.json({
            message: 'Token renovado exitosamente',
            token: newToken,
            refreshToken: newRefreshToken,
            expiresAt: expiresAt.toISOString()
        });

    } catch (error) {
        console.error('Error en renovación de token:', error);
        res.status(401).json({
            error: 'Token de renovación inválido'
        });
    }
});

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                error: 'Token requerido'
            });
        }

        const db = getDatabase();

        // Eliminar sesión
        const result = db.prepare(`
            DELETE FROM sessions WHERE token = ?
        `).run(token);

        if (result.changes > 0) {
            res.json({
                message: 'Sesión cerrada exitosamente'
            });
        } else {
            res.status(404).json({
                error: 'Sesión no encontrada'
            });
        }

    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// GET /api/auth/verify - Verificar token
router.get('/verify', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Token de autorización requerido'
            });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'timeline-secret-key'
        );

        const db = getDatabase();
        const user = db.prepare(`
            SELECT id, email, name, region, is_active
            FROM users WHERE id = ?
        `).get(decoded.userId);

        if (!user || !user.is_active) {
            return res.status(401).json({
                error: 'Usuario no válido'
            });
        }

        res.json({
            valid: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                region: user.region
            }
        });

    } catch (error) {
        console.error('Error en verificación:', error);
        res.status(401).json({
            error: 'Token inválido'
        });
    }
});

export default router;
