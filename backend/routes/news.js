import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// =====================================================
// MIDDLEWARE DE VALIDACIÓN
// =====================================================

const validateNewsQuery = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Página debe ser un número entero mayor a 0'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Límite debe ser entre 1 y 100'),
    query('category')
        .optional()
        .isIn(['conservative', 'centrist', 'progressive', 'regional'])
        .withMessage('Categoría no válida'),
    query('region')
        .optional()
        .isString()
        .withMessage('Región debe ser texto'),
    query('source_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de fuente debe ser un número entero'),
    query('search')
        .optional()
        .isString()
        .withMessage('Búsqueda debe ser texto'),
    query('date_from')
        .optional()
        .isISO8601()
        .withMessage('Fecha desde debe ser formato ISO8601'),
    query('date_to')
        .optional()
        .isISO8601()
        .withMessage('Fecha hasta debe ser formato ISO8601')
];

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function buildNewsQuery(filters) {
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Filtro por categoría
    if (filters.category) {
        whereConditions.push(`ni.category = ?`);
        params.push(filters.category);
    }

    // Filtro por región
    if (filters.region) {
        whereConditions.push(`ni.region = ?`);
        params.push(filters.region);
    }

    // Filtro por fuente
    if (filters.source_id) {
        whereConditions.push(`ni.source_id = ?`);
        params.push(filters.source_id);
    }

    // Búsqueda en título y descripción
    if (filters.search) {
        whereConditions.push(`(ni.title LIKE ? OR ni.description LIKE ?)`);
        params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    // Filtro por fecha desde
    if (filters.date_from) {
        whereConditions.push(`ni.pub_date >= ?`);
        params.push(filters.date_from);
    }

    // Filtro por fecha hasta
    if (filters.date_to) {
        whereConditions.push(`ni.pub_date <= ?`);
        params.push(filters.date_to);
    }

    const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    return { whereClause, params };
}

// =====================================================
// RUTAS DE NOTICIAS
// =====================================================

// GET /api/news - Obtener noticias
router.get('/', validateNewsQuery, async (req, res) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Parámetros de consulta inválidos',
                details: errors.array()
            });
        }

        const {
            page = 1,
            limit = 20,
            category,
            region,
            source_id,
            search,
            date_from,
            date_to,
            featured = false
        } = req.query;

        const db = getDatabase();
        const offset = (page - 1) * limit;

        // Construir consulta
        const filters = {
            category,
            region,
            source_id,
            search,
            date_from,
            date_to
        };

        const { whereClause, params } = buildNewsQuery(filters);

        // Agregar filtro de destacadas si es necesario
        let finalWhereClause = whereClause;
        if (featured === 'true') {
            if (finalWhereClause) {
                finalWhereClause += ' AND ni.is_featured = 1';
            } else {
                finalWhereClause = 'WHERE ni.is_featured = 1';
            }
        }

        // Consulta principal
        const newsQuery = `
            SELECT 
                ni.id,
                ni.title,
                ni.description,
                ni.content,
                ni.link,
                ni.image_url,
                ni.pub_date,
                ni.guid,
                ni.category,
                ni.region,
                ni.tags,
                ni.is_featured,
                ni.view_count,
                ni.created_at,
                ns.name as source_name,
                ns.website_url as source_website,
                ns.logo_url as source_logo
            FROM news_items ni
            JOIN news_sources ns ON ni.source_id = ns.id
            ${finalWhereClause}
            ORDER BY ni.pub_date DESC
            LIMIT ? OFFSET ?
        `;

        const news = db.prepare(newsQuery).all(...params, limit, offset);

        // Consulta para contar total
        const countQuery = `
            SELECT COUNT(*) as total
            FROM news_items ni
            JOIN news_sources ns ON ni.source_id = ns.id
            ${finalWhereClause}
        `;

        const { total } = db.prepare(countQuery).get(...params);

        // Calcular metadatos de paginación
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.json({
            news,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages,
                hasNextPage,
                hasPrevPage
            },
            filters: {
                category,
                region,
                source_id,
                search,
                date_from,
                date_to,
                featured
            }
        });

    } catch (error) {
        console.error('Error al obtener noticias:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener las noticias'
        });
    }
});

// GET /api/news/featured - Obtener noticias destacadas
router.get('/featured', async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const db = getDatabase();

        const featuredNews = db.prepare(`
            SELECT 
                ni.id,
                ni.title,
                ni.description,
                ni.link,
                ni.image_url,
                ni.pub_date,
                ni.category,
                ni.region,
                ni.view_count,
                ns.name as source_name,
                ns.logo_url as source_logo
            FROM news_items ni
            JOIN news_sources ns ON ni.source_id = ns.id
            WHERE ni.is_featured = 1
            ORDER BY ni.pub_date DESC
            LIMIT ?
        `).all(limit);

        res.json({
            featured: featuredNews,
            count: featuredNews.length
        });

    } catch (error) {
        console.error('Error al obtener noticias destacadas:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener las noticias destacadas'
        });
    }
});

// GET /api/news/latest - Obtener últimas noticias
router.get('/latest', async (req, res) => {
    try {
        const { limit = 10, category } = req.query;
        const db = getDatabase();

        let whereClause = '';
        let params = [];

        if (category) {
            whereClause = 'WHERE ni.category = ?';
            params.push(category);
        }

        const latestNews = db.prepare(`
            SELECT 
                ni.id,
                ni.title,
                ni.description,
                ni.link,
                ni.image_url,
                ni.pub_date,
                ni.category,
                ni.region,
                ns.name as source_name,
                ns.logo_url as source_logo
            FROM news_items ni
            JOIN news_sources ns ON ni.source_id = ns.id
            ${whereClause}
            ORDER BY ni.pub_date DESC
            LIMIT ?
        `).all(...params, limit);

        res.json({
            latest: latestNews,
            count: latestNews.length,
            category: category || 'all'
        });

    } catch (error) {
        console.error('Error al obtener últimas noticias:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener las últimas noticias'
        });
    }
});

// GET /api/news/categories - Obtener estadísticas por categoría
router.get('/categories', async (req, res) => {
    try {
        const db = getDatabase();

        const categoryStats = db.prepare(`
            SELECT 
                ni.category,
                COUNT(*) as total_news,
                COUNT(CASE WHEN ni.created_at >= datetime('now', '-24 hours') THEN 1 END) as news_last_24h,
                MAX(ni.pub_date) as latest_news_date
            FROM news_items ni
            GROUP BY ni.category
            ORDER BY total_news DESC
        `).all();

        res.json({
            categories: categoryStats,
            total_categories: categoryStats.length
        });

    } catch (error) {
        console.error('Error al obtener estadísticas de categorías:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener las estadísticas'
        });
    }
});

// GET /api/news/regions - Obtener estadísticas por región
router.get('/regions', async (req, res) => {
    try {
        const db = getDatabase();

        const regionStats = db.prepare(`
            SELECT 
                ni.region,
                COUNT(*) as total_news,
                COUNT(CASE WHEN ni.created_at >= datetime('now', '-24 hours') THEN 1 END) as news_last_24h,
                MAX(ni.pub_date) as latest_news_date
            FROM news_items ni
            WHERE ni.region IS NOT NULL
            GROUP BY ni.region
            ORDER BY total_news DESC
        `).all();

        res.json({
            regions: regionStats,
            total_regions: regionStats.length
        });

    } catch (error) {
        console.error('Error al obtener estadísticas de regiones:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener las estadísticas'
        });
    }
});

// GET /api/news/:id - Obtener noticia por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();

        const newsItem = db.prepare(`
            SELECT 
                ni.*,
                ns.name as source_name,
                ns.website_url as source_website,
                ns.logo_url as source_logo,
                ns.description as source_description
            FROM news_items ni
            JOIN news_sources ns ON ni.source_id = ns.id
            WHERE ni.id = ?
        `).get(id);

        if (!newsItem) {
            return res.status(404).json({
                error: 'Noticia no encontrada',
                message: 'La noticia solicitada no existe'
            });
        }

        // Incrementar contador de vistas
        db.prepare(`
            UPDATE news_items 
            SET view_count = view_count + 1 
            WHERE id = ?
        `).run(id);

        res.json({
            news: newsItem
        });

    } catch (error) {
        console.error('Error al obtener noticia:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo obtener la noticia'
        });
    }
});

// POST /api/news/:id/view - Incrementar vistas de noticia
router.post('/:id/view', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();

        const result = db.prepare(`
            UPDATE news_items 
            SET view_count = view_count + 1 
            WHERE id = ?
        `).run(id);

        if (result.changes > 0) {
            const newsItem = db.prepare(`
                SELECT view_count FROM news_items WHERE id = ?
            `).get(id);

            res.json({
                message: 'Vista registrada',
                view_count: newsItem.view_count
            });
        } else {
            res.status(404).json({
                error: 'Noticia no encontrada'
            });
        }

    } catch (error) {
        console.error('Error al registrar vista:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// GET /api/news/search/suggestions - Obtener sugerencias de búsqueda
router.get('/search/suggestions', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.json({
                suggestions: []
            });
        }

        const db = getDatabase();
        const searchTerm = `%${q}%`;

        const suggestions = db.prepare(`
            SELECT DISTINCT title
            FROM news_items
            WHERE title LIKE ?
            ORDER BY pub_date DESC
            LIMIT 10
        `).all(searchTerm);

        res.json({
            suggestions: suggestions.map(item => item.title)
        });

    } catch (error) {
        console.error('Error al obtener sugerencias:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

export default router;
