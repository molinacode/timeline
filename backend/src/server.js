import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Importar rutas
import authRoutes from './routes/auth.js';
import newsRoutes from './routes/news.js';
import sourcesRoutes from './routes/sources.js';
import usersRoutes from './routes/users.js';
import rssRoutes from './routes/rss.js';

// Importar middleware
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';

// Importar configuración de base de datos
import { initDatabase } from './config/database.js';

// Configurar dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// =====================================================
// MIDDLEWARE GLOBAL
// =====================================================

// Seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP
    message: {
        error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(logger);

// =====================================================
// RUTAS
// =====================================================

// Ruta de salud
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// Ruta de información de la API
app.get('/api', (req, res) => {
    res.json({
        name: 'TimeLine RSS Aggregator API',
        version: '1.0.0',
        description: 'API REST para el agregador de noticias RSS TimeLine',
        endpoints: {
            auth: '/api/auth',
            news: '/api/news',
            sources: '/api/sources',
            users: '/api/users'
        },
        documentation: '/api/docs',
        health: '/health'
    });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/sources', sourcesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/rss', rssRoutes);

// Servir archivos estáticos (para documentación)
app.use('/docs', express.static(join(__dirname, '../docs')));

// =====================================================
// MANEJO DE ERRORES
// =====================================================

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        message: `La ruta ${req.originalUrl} no existe`,
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
});

// Middleware de manejo de errores
app.use(errorHandler);

// =====================================================
// INICIALIZACIÓN DEL SERVIDOR
// =====================================================

async function startServer() {
    try {
        // Inicializar base de datos
        console.log('🔄 Inicializando base de datos...');
        await initDatabase();
        console.log('✅ Base de datos inicializada correctamente');

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('🚀 Servidor TimeLine API iniciado');
            console.log(`📡 Puerto: ${PORT}`);
            console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📚 Documentación: http://localhost:${PORT}/docs`);
            console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
            console.log(`🔗 API Base: http://localhost:${PORT}/api`);
            
            if (process.env.NODE_ENV === 'development') {
                console.log('\n📋 Rutas disponibles:');
                console.log('  POST /api/auth/login     - Iniciar sesión');
                console.log('  POST /api/auth/register  - Registro de usuario');
                console.log('  GET  /api/news           - Obtener noticias');
                console.log('  GET  /api/sources         - Obtener fuentes');
                console.log('  GET  /api/users/profile  - Perfil de usuario');
            }
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

// Manejo de señales de cierre
process.on('SIGTERM', () => {
    console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
    process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
    process.exit(1);
});

// Iniciar servidor
startServer();

export default app;
