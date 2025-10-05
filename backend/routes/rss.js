import express from 'express';
import { query, validationResult } from 'express-validator';
import { parseRSSFeed, testRSSUrl, testMultipleRSSUrls } from '../services/nativeRSSService.js';
import { getDatabase } from '../config/database.js';

const router = express.Router();

// =====================================================
// MIDDLEWARE DE VALIDACIÓN
// =====================================================

const validateRSSQuery = [
    query('url')
        .isURL()
        .withMessage('URL válida requerida'),
    query('format')
        .optional()
        .isIn(['json', 'xml'])
        .withMessage('Formato debe ser json o xml')
];

// =====================================================
// RUTAS DE RSS
// =====================================================

// GET /api/rss/proxy - Proxy para RSS feeds
router.get('/proxy', validateRSSQuery, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Parámetros inválidos',
                details: errors.array()
            });
        }

        const { url, format = 'json' } = req.query;
        
        console.log(`🔄 Proxying RSS feed: ${url}`);
        
        // Crear fuente temporal para el parsing
        const tempSource = {
            id: 'proxy-' + Date.now(),
            name: 'Proxy Feed',
            rssUrl: url,
            category: 'centrist',
            isActive: true
        };
        
        // Parsear el feed
        const parsedData = await parseRSSFeed(tempSource);
        
        if (format === 'xml') {
            // Devolver XML original (si está disponible)
            res.setHeader('Content-Type', 'application/xml');
            res.send(parsedData.rawXml || '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Proxy Feed</title></channel></rss>');
        } else {
            // Devolver JSON
            res.json({
                success: true,
                feed: {
                    title: parsedData.source,
                    description: parsedData.description || '',
                    link: parsedData.link || url,
                    lastFetched: parsedData.lastFetched,
                    itemsCount: parsedData.items.length
                },
                items: parsedData.items,
                error: parsedData.error
            });
        }
        
    } catch (error) {
        console.error('Error proxying RSS feed:', error);
        res.status(500).json({
            error: 'Error al procesar el feed RSS',
            message: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});

// GET /api/rss/test - Probar URL RSS
router.get('/test', validateRSSQuery, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Parámetros inválidos',
                details: errors.array()
            });
        }

        const { url } = req.query;
        
        console.log(`🧪 Testing RSS URL: ${url}`);
        
        const result = await testRSSUrl(url);
        
        res.json({
            url,
            ...result,
            testedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error testing RSS URL:', error);
        res.status(500).json({
            error: 'Error al probar la URL RSS',
            message: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});

// POST /api/rss/test-multiple - Probar múltiples URLs RSS
router.post('/test-multiple', async (req, res) => {
    try {
        const { urls } = req.body;
        
        if (!Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({
                error: 'Array de URLs requerido'
            });
        }
        
        if (urls.length > 20) {
            return res.status(400).json({
                error: 'Máximo 20 URLs por solicitud'
            });
        }
        
        console.log(`🧪 Testing ${urls.length} RSS URLs...`);
        
        const results = await testMultipleRSSUrls(urls);
        
        res.json({
            results,
            testedAt: new Date().toISOString(),
            totalTested: urls.length,
            successful: Object.values(results).filter(r => r.success).length,
            failed: Object.values(results).filter(r => !r.success).length
        });
        
    } catch (error) {
        console.error('Error testing multiple RSS URLs:', error);
        res.status(500).json({
            error: 'Error al probar las URLs RSS',
            message: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});

// GET /api/rss/sources - Obtener fuentes RSS configuradas
router.get('/sources', async (req, res) => {
    try {
        const db = getDatabase();
        
        const sources = db.prepare(`
            SELECT 
                id, name, rss_url, website_url, category, region, 
                description, logo_url, is_active, last_fetched,
                created_at, updated_at
            FROM news_sources 
            ORDER BY category, name
        `).all();
        
        res.json({
            sources,
            count: sources.length,
            categories: {
                conservative: sources.filter(s => s.category === 'conservative').length,
                centrist: sources.filter(s => s.category === 'centrist').length,
                progressive: sources.filter(s => s.category === 'progressive').length,
                regional: sources.filter(s => s.category === 'regional').length
            }
        });
        
    } catch (error) {
        console.error('Error getting RSS sources:', error);
        res.status(500).json({
            error: 'Error al obtener fuentes RSS',
            message: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});

// GET /api/rss/sources/:id - Obtener fuente RSS específica
router.get('/sources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();
        
        const source = db.prepare(`
            SELECT 
                id, name, rss_url, website_url, category, region, 
                description, logo_url, is_active, last_fetched,
                created_at, updated_at
            FROM news_sources 
            WHERE id = ?
        `).get(id);
        
        if (!source) {
            return res.status(404).json({
                error: 'Fuente RSS no encontrada'
            });
        }
        
        // Obtener estadísticas de la fuente
        const stats = db.prepare(`
            SELECT 
                COUNT(*) as total_items,
                COUNT(CASE WHEN created_at >= datetime('now', '-24 hours') THEN 1 END) as items_last_24h,
                MAX(pub_date) as latest_item_date
            FROM news_items 
            WHERE source_id = ?
        `).get(id);
        
        res.json({
            source: {
                ...source,
                stats
            }
        });
        
    } catch (error) {
        console.error('Error getting RSS source:', error);
        res.status(500).json({
            error: 'Error al obtener fuente RSS',
            message: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});

// POST /api/rss/sources - Crear nueva fuente RSS
router.post('/sources', async (req, res) => {
    try {
        const { name, rss_url, website_url, category, region, description } = req.body;
        
        if (!name || !rss_url || !category) {
            return res.status(400).json({
                error: 'Nombre, URL RSS y categoría son requeridos'
            });
        }
        
        const db = getDatabase();
        
        // Verificar si la URL ya existe
        const existing = db.prepare(`
            SELECT id FROM news_sources WHERE rss_url = ?
        `).get(rss_url);
        
        if (existing) {
            return res.status(409).json({
                error: 'Ya existe una fuente con esta URL RSS'
            });
        }
        
        // Crear nueva fuente
        const result = db.prepare(`
            INSERT INTO news_sources (
                name, rss_url, website_url, category, region, 
                description, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
        `).run(name, rss_url, website_url || null, category, region || null, description || null);
        
        const newSource = db.prepare(`
            SELECT * FROM news_sources WHERE id = ?
        `).get(result.lastInsertRowid);
        
        res.status(201).json({
            message: 'Fuente RSS creada exitosamente',
            source: newSource
        });
        
    } catch (error) {
        console.error('Error creating RSS source:', error);
        res.status(500).json({
            error: 'Error al crear fuente RSS',
            message: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});

// PUT /api/rss/sources/:id - Actualizar fuente RSS
router.put('/sources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, rss_url, website_url, category, region, description, is_active } = req.body;
        
        const db = getDatabase();
        
        // Verificar que la fuente existe
        const existing = db.prepare(`
            SELECT id FROM news_sources WHERE id = ?
        `).get(id);
        
        if (!existing) {
            return res.status(404).json({
                error: 'Fuente RSS no encontrada'
            });
        }
        
        // Actualizar fuente
        const result = db.prepare(`
            UPDATE news_sources 
            SET name = ?, rss_url = ?, website_url = ?, category = ?, 
                region = ?, description = ?, is_active = ?, updated_at = datetime('now')
            WHERE id = ?
        `).run(
            name || null,
            rss_url || null,
            website_url || null,
            category || null,
            region || null,
            description || null,
            is_active !== undefined ? is_active : 1,
            id
        );
        
        const updatedSource = db.prepare(`
            SELECT * FROM news_sources WHERE id = ?
        `).get(id);
        
        res.json({
            message: 'Fuente RSS actualizada exitosamente',
            source: updatedSource
        });
        
    } catch (error) {
        console.error('Error updating RSS source:', error);
        res.status(500).json({
            error: 'Error al actualizar fuente RSS',
            message: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});

// DELETE /api/rss/sources/:id - Eliminar fuente RSS
router.delete('/sources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();
        
        // Verificar que la fuente existe
        const existing = db.prepare(`
            SELECT id FROM news_sources WHERE id = ?
        `).get(id);
        
        if (!existing) {
            return res.status(404).json({
                error: 'Fuente RSS no encontrada'
            });
        }
        
        // Eliminar fuente (esto también eliminará las noticias relacionadas por CASCADE)
        const result = db.prepare(`
            DELETE FROM news_sources WHERE id = ?
        `).run(id);
        
        res.json({
            message: 'Fuente RSS eliminada exitosamente',
            deletedRows: result.changes
        });
        
    } catch (error) {
        console.error('Error deleting RSS source:', error);
        res.status(500).json({
            error: 'Error al eliminar fuente RSS',
            message: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});

// POST /api/rss/fetch - Ejecutar fetch manual de todas las fuentes
router.post('/fetch', async (req, res) => {
    try {
        console.log('🔄 Manual RSS fetch requested');
        
        const db = getDatabase();
        const sources = db.prepare(`
            SELECT * FROM news_sources 
            WHERE is_active = 1 
            ORDER BY last_fetched ASC
        `).all();
        
        if (sources.length === 0) {
            return res.json({
                message: 'No hay fuentes activas para procesar',
                sourcesProcessed: 0,
                itemsFetched: 0
            });
        }
        
        console.log(`📡 Fetching ${sources.length} sources...`);
        
        const results = await parseMultipleFeeds(sources);
        
        const totalItems = results.reduce((sum, result) => sum + result.items.length, 0);
        const successfulSources = results.filter(r => !r.error).length;
        
        res.json({
            message: 'Fetch manual completado',
            sourcesProcessed: sources.length,
            successfulSources,
            failedSources: sources.length - successfulSources,
            itemsFetched: totalItems,
            results: results.map(r => ({
                source: r.source,
                itemsCount: r.items.length,
                error: r.error
            }))
        });
        
    } catch (error) {
        console.error('Error in manual RSS fetch:', error);
        res.status(500).json({
            error: 'Error al ejecutar fetch manual',
            message: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});

// GET /api/rss/stats - Estadísticas de RSS
router.get('/stats', async (req, res) => {
    try {
        const db = getDatabase();
        
        const stats = {
            sources: {
                total: db.prepare('SELECT COUNT(*) as count FROM news_sources').get().count,
                active: db.prepare('SELECT COUNT(*) as count FROM news_sources WHERE is_active = 1').get().count,
                byCategory: {
                    conservative: db.prepare('SELECT COUNT(*) as count FROM news_sources WHERE category = "conservative"').get().count,
                    centrist: db.prepare('SELECT COUNT(*) as count FROM news_sources WHERE category = "centrist"').get().count,
                    progressive: db.prepare('SELECT COUNT(*) as count FROM news_sources WHERE category = "progressive"').get().count,
                    regional: db.prepare('SELECT COUNT(*) as count FROM news_sources WHERE category = "regional"').get().count
                }
            },
            items: {
                total: db.prepare('SELECT COUNT(*) as count FROM news_items').get().count,
                last24h: db.prepare('SELECT COUNT(*) as count FROM news_items WHERE created_at >= datetime("now", "-24 hours")').get().count,
                last7d: db.prepare('SELECT COUNT(*) as count FROM news_items WHERE created_at >= datetime("now", "-7 days")').get().count
            },
            fetchLogs: {
                total: db.prepare('SELECT COUNT(*) as count FROM fetch_logs').get().count,
                last24h: db.prepare('SELECT COUNT(*) as count FROM fetch_logs WHERE created_at >= datetime("now", "-24 hours")').get().count,
                successful: db.prepare('SELECT COUNT(*) as count FROM fetch_logs WHERE status = "success"').get().count,
                failed: db.prepare('SELECT COUNT(*) as count FROM fetch_logs WHERE status = "error"').get().count
            }
        };
        
        res.json({
            stats,
            generatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error getting RSS stats:', error);
        res.status(500).json({
            error: 'Error al obtener estadísticas RSS',
            message: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});

export default router;
