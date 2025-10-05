import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración
const DB_PATH = process.env.DB_PATH || join(__dirname, '../database/timeline.db');
const SCHEMA_PATH = join(__dirname, '../database/schema.sql');

// =====================================================
// FUNCIÓN PRINCIPAL DE MIGRACIÓN
// =====================================================

async function migrate() {
    try {
        console.log('🔄 Iniciando migración de base de datos...');
        
        // Crear directorio si no existe
        const dbDir = dirname(DB_PATH);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // Conectar a la base de datos
        const db = new Database(DB_PATH);
        
        // Configurar pragmas
        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = NORMAL');
        db.pragma('foreign_keys = ON');

        console.log('📋 Ejecutando esquema de base de datos...');
        
        // Leer y ejecutar esquema
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
        const statements = schema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        let executedStatements = 0;
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    db.exec(statement);
                    executedStatements++;
                } catch (error) {
                    if (!error.message.includes('already exists')) {
                        console.warn(`⚠️ Advertencia: ${error.message}`);
                    }
                }
            }
        }

        console.log(`✅ Esquema ejecutado: ${executedStatements} declaraciones`);

        // Verificar integridad
        const integrityCheck = db.prepare('PRAGMA integrity_check').get();
        if (integrityCheck.integrity_check !== 'ok') {
            throw new Error('Problemas de integridad en la base de datos');
        }

        // Mostrar estadísticas
        const stats = getDatabaseStats(db);
        console.log('📊 Estadísticas de la base de datos:');
        console.log(`   - Usuarios: ${stats.users}`);
        console.log(`   - Fuentes: ${stats.news_sources}`);
        console.log(`   - Noticias: ${stats.news_items}`);
        console.log(`   - Sesiones: ${stats.sessions}`);

        db.close();
        console.log('✅ Migración completada exitosamente');
        
    } catch (error) {
        console.error('❌ Error en migración:', error);
        process.exit(1);
    }
}

// =====================================================
// FUNCIÓN PARA OBTENER ESTADÍSTICAS
// =====================================================

function getDatabaseStats(db) {
    try {
        return {
            users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
            news_sources: db.prepare('SELECT COUNT(*) as count FROM news_sources').get().count,
            news_items: db.prepare('SELECT COUNT(*) as count FROM news_items').get().count,
            sessions: db.prepare('SELECT COUNT(*) as count FROM sessions').get().count
        };
    } catch (error) {
        return { users: 0, news_sources: 0, news_items: 0, sessions: 0 };
    }
}

// =====================================================
// FUNCIÓN PARA SEMILLAR DATOS DE PRUEBA
// =====================================================

async function seed() {
    try {
        console.log('🌱 Iniciando seed de datos de prueba...');
        
        const db = new Database(DB_PATH);
        
        // Verificar si ya hay datos
        const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        if (userCount > 0) {
            console.log('⚠️ La base de datos ya contiene datos. Saltando seed.');
            db.close();
            return;
        }

        // Crear usuario de prueba
        console.log('👤 Creando usuario de prueba...');
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.hash('password123', 12);
        
        const userResult = db.prepare(`
            INSERT INTO users (email, password_hash, name, region, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        `).run('test@timeline.com', passwordHash, 'Usuario de Prueba', 'madrid');

        const userId = userResult.lastInsertRowid;

        // Crear preferencias de usuario
        db.prepare(`
            INSERT INTO user_preferences (user_id, theme, language, region, notifications)
            VALUES (?, 'light', 'es', 'madrid', TRUE)
        `).run(userId);

        // Crear algunas fuentes personalizadas
        console.log('📰 Creando fuentes personalizadas de prueba...');
        db.prepare(`
            INSERT INTO user_custom_sources (user_id, name, rss_url, category, region, is_active)
            VALUES (?, ?, ?, ?, ?, TRUE)
        `).run(userId, 'Mi Fuente Personal', 'https://example.com/rss', 'centrist', 'madrid');

        // Crear algunas noticias de ejemplo
        console.log('📄 Creando noticias de ejemplo...');
        const sampleNews = [
            {
                source_id: 1, // ABC
                title: 'Noticia de ejemplo 1',
                description: 'Esta es una noticia de ejemplo para demostrar el funcionamiento del sistema.',
                link: 'https://example.com/news1',
                pub_date: new Date().toISOString(),
                category: 'conservative',
                region: null,
                is_featured: true
            },
            {
                source_id: 9, // El Mundo
                title: 'Noticia de ejemplo 2',
                description: 'Otra noticia de ejemplo para mostrar la funcionalidad del agregador.',
                link: 'https://example.com/news2',
                pub_date: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
                category: 'centrist',
                region: null,
                is_featured: false
            },
            {
                source_id: 17, // El País
                title: 'Noticia de ejemplo 3',
                description: 'Tercera noticia de ejemplo con contenido más detallado.',
                link: 'https://example.com/news3',
                pub_date: new Date(Date.now() - 7200000).toISOString(), // 2 horas atrás
                category: 'progressive',
                region: null,
                is_featured: true
            }
        ];

        for (const news of sampleNews) {
            db.prepare(`
                INSERT INTO news_items (
                    source_id, title, description, link, pub_date, 
                    category, region, is_featured, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `).run(
                news.source_id,
                news.title,
                news.description,
                news.link,
                news.pub_date,
                news.category,
                news.region,
                news.is_featured
            );
        }

        // Crear algunos logs de fetch
        console.log('📊 Creando logs de ejemplo...');
        db.prepare(`
            INSERT INTO fetch_logs (source_id, status, items_fetched, fetch_duration, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        `).run(1, 'success', 5, 1500);

        db.prepare(`
            INSERT INTO fetch_logs (source_id, status, items_fetched, fetch_duration, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        `).run(9, 'success', 3, 1200);

        // Mostrar estadísticas finales
        const finalStats = getDatabaseStats(db);
        console.log('📊 Estadísticas después del seed:');
        console.log(`   - Usuarios: ${finalStats.users}`);
        console.log(`   - Fuentes: ${finalStats.news_sources}`);
        console.log(`   - Noticias: ${finalStats.news_items}`);
        console.log(`   - Sesiones: ${finalStats.sessions}`);

        db.close();
        console.log('✅ Seed completado exitosamente');
        console.log('🔑 Credenciales de prueba:');
        console.log('   Email: test@timeline.com');
        console.log('   Contraseña: password123');
        
    } catch (error) {
        console.error('❌ Error en seed:', error);
        process.exit(1);
    }
}

// =====================================================
// FUNCIÓN PARA RESETEAR LA BASE DE DATOS
// =====================================================

async function reset() {
    try {
        console.log('🔄 Reseteando base de datos...');
        
        if (fs.existsSync(DB_PATH)) {
            fs.unlinkSync(DB_PATH);
            console.log('🗑️ Base de datos anterior eliminada');
        }
        
        await migrate();
        await seed();
        
        console.log('✅ Reset completado exitosamente');
        
    } catch (error) {
        console.error('❌ Error en reset:', error);
        process.exit(1);
    }
}

// =====================================================
// FUNCIÓN PARA MOSTRAR ESTADÍSTICAS
// =====================================================

async function stats() {
    try {
        const db = new Database(DB_PATH);
        const stats = getDatabaseStats(db);
        
        console.log('📊 Estadísticas de la base de datos:');
        console.log(`   - Usuarios: ${stats.users}`);
        console.log(`   - Fuentes: ${stats.news_sources}`);
        console.log(`   - Noticias: ${stats.news_items}`);
        console.log(`   - Sesiones: ${stats.sessions}`);
        
        // Estadísticas adicionales
        const recentNews = db.prepare(`
            SELECT COUNT(*) as count 
            FROM news_items 
            WHERE created_at >= datetime('now', '-24 hours')
        `).get().count;
        
        const activeSources = db.prepare(`
            SELECT COUNT(*) as count 
            FROM news_sources 
            WHERE is_active = 1
        `).get().count;
        
        console.log(`   - Noticias últimas 24h: ${recentNews}`);
        console.log(`   - Fuentes activas: ${activeSources}`);
        
        db.close();
        
    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        process.exit(1);
    }
}

// =====================================================
// MANEJO DE ARGUMENTOS DE LÍNEA DE COMANDOS
// =====================================================

const command = process.argv[2];

switch (command) {
    case 'migrate':
        migrate();
        break;
    case 'seed':
        seed();
        break;
    case 'reset':
        reset();
        break;
    case 'stats':
        stats();
        break;
    default:
        console.log('📋 Comandos disponibles:');
        console.log('  npm run migrate  - Ejecutar migración');
        console.log('  npm run seed     - Poblar con datos de prueba');
        console.log('  npm run reset    - Resetear y poblar base de datos');
        console.log('  npm run stats    - Mostrar estadísticas');
        break;
}
