import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de la base de datos
const DB_PATH = process.env.DB_PATH || join(__dirname, '../../database/timeline.db');
const SCHEMA_PATH = join(__dirname, '../../database/schema.sql');

let db = null;

// =====================================================
// FUNCIÓN PARA INICIALIZAR LA BASE DE DATOS
// =====================================================
export async function initDatabase() {
    try {
        console.log('🔄 Inicializando base de datos SQLite...');
        
        // Crear directorio de base de datos si no existe
        const dbDir = dirname(DB_PATH);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // Conectar a la base de datos
        db = new Database(DB_PATH);
        
        // Configurar pragmas para mejor rendimiento
        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = NORMAL');
        db.pragma('cache_size = 1000');
        db.pragma('temp_store = MEMORY');
        db.pragma('foreign_keys = ON');

        // Verificar si la base de datos ya existe y tiene tablas
        const tablesExist = checkTablesExist();
        
        if (!tablesExist) {
            console.log('📋 Creando esquema de base de datos...');
            await createSchema();
            console.log('✅ Esquema creado correctamente');
        } else {
            console.log('✅ Base de datos ya existe, verificando integridad...');
            await verifyDatabaseIntegrity();
        }

        // Ejecutar migraciones si es necesario
        await runMigrations();

        console.log(`✅ Base de datos inicializada: ${DB_PATH}`);
        return db;

    } catch (error) {
        console.error('❌ Error al inicializar la base de datos:', error);
        throw error;
    }
}

// =====================================================
// FUNCIÓN PARA VERIFICAR SI LAS TABLAS EXISTEN
// =====================================================
function checkTablesExist() {
    try {
        const result = db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='users'
        `).get();
        
        return !!result;
    } catch (error) {
        return false;
    }
}

// =====================================================
// FUNCIÓN PARA CREAR EL ESQUEMA
// =====================================================
async function createSchema() {
    try {
        // Leer el archivo de esquema
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
        
        // Dividir el esquema en declaraciones individuales
        const statements = schema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        // Ejecutar cada declaración
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    db.exec(statement);
                } catch (error) {
                    // Ignorar errores de tablas que ya existen
                    if (!error.message.includes('already exists')) {
                        console.warn('⚠️ Advertencia al ejecutar declaración:', error.message);
                    }
                }
            }
        }

        console.log('📊 Esquema de base de datos creado exitosamente');
    } catch (error) {
        console.error('❌ Error al crear el esquema:', error);
        throw error;
    }
}

// =====================================================
// FUNCIÓN PARA VERIFICAR LA INTEGRIDAD DE LA BASE DE DATOS
// =====================================================
async function verifyDatabaseIntegrity() {
    try {
        // Verificar integridad de la base de datos
        const result = db.prepare('PRAGMA integrity_check').get();
        
        if (result.integrity_check !== 'ok') {
            console.warn('⚠️ Problemas de integridad detectados:', result.integrity_check);
        }

        // Verificar que todas las tablas necesarias existen
        const requiredTables = [
            'users', 'news_sources', 'news_items', 
            'user_sources', 'user_custom_sources', 
            'user_preferences', 'fetch_logs', 'sessions'
        ];

        for (const table of requiredTables) {
            const exists = db.prepare(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name=?
            `).get(table);
            
            if (!exists) {
                console.warn(`⚠️ Tabla faltante: ${table}`);
            }
        }

        console.log('✅ Verificación de integridad completada');
    } catch (error) {
        console.error('❌ Error en verificación de integridad:', error);
    }
}

// =====================================================
// FUNCIÓN PARA EJECUTAR MIGRACIONES
// =====================================================
async function runMigrations() {
    try {
        // Crear tabla de migraciones si no existe
        db.exec(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version VARCHAR(50) UNIQUE NOT NULL,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Verificar migraciones pendientes
        const migrationsDir = join(__dirname, '../database/migrations');
        
        if (fs.existsSync(migrationsDir)) {
            const migrationFiles = fs.readdirSync(migrationsDir)
                .filter(file => file.endsWith('.sql'))
                .sort();

            for (const file of migrationFiles) {
                const version = file.replace('.sql', '');
                
                // Verificar si la migración ya se ejecutó
                const executed = db.prepare(`
                    SELECT id FROM migrations WHERE version = ?
                `).get(version);

                if (!executed) {
                    console.log(`🔄 Ejecutando migración: ${version}`);
                    
                    const migrationSQL = fs.readFileSync(
                        join(migrationsDir, file), 
                        'utf8'
                    );
                    
                    db.exec(migrationSQL);
                    
                    // Registrar migración ejecutada
                    db.prepare(`
                        INSERT INTO migrations (version) VALUES (?)
                    `).run(version);
                    
                    console.log(`✅ Migración ${version} ejecutada`);
                }
            }
        }
    } catch (error) {
        console.error('❌ Error al ejecutar migraciones:', error);
    }
}

// =====================================================
// FUNCIÓN PARA OBTENER LA INSTANCIA DE LA BASE DE DATOS
// =====================================================
export function getDatabase() {
    if (!db) {
        throw new Error('Base de datos no inicializada. Llama a initDatabase() primero.');
    }
    return db;
}

// =====================================================
// FUNCIÓN PARA CERRAR LA CONEXIÓN
// =====================================================
export function closeDatabase() {
    if (db) {
        db.close();
        db = null;
        console.log('🔒 Conexión a base de datos cerrada');
    }
}

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

// Función para ejecutar consultas con transacciones
export function transaction(callback) {
    const transaction = db.transaction(callback);
    return transaction;
}

// Función para obtener estadísticas de la base de datos
export function getDatabaseStats() {
    try {
        const stats = {
            users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
            news_sources: db.prepare('SELECT COUNT(*) as count FROM news_sources').get().count,
            news_items: db.prepare('SELECT COUNT(*) as count FROM news_items').get().count,
            user_sources: db.prepare('SELECT COUNT(*) as count FROM user_sources').get().count,
            user_custom_sources: db.prepare('SELECT COUNT(*) as count FROM user_custom_sources').get().count,
            fetch_logs: db.prepare('SELECT COUNT(*) as count FROM fetch_logs').get().count,
            sessions: db.prepare('SELECT COUNT(*) as count FROM sessions').get().count
        };

        return stats;
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return null;
    }
}

// Función para limpiar datos antiguos
export function cleanupOldData() {
    try {
        const transaction = db.transaction(() => {
            // Limpiar sesiones expiradas
            db.prepare(`
                DELETE FROM sessions 
                WHERE expires_at < datetime('now')
            `).run();

            // Limpiar logs antiguos (más de 30 días)
            db.prepare(`
                DELETE FROM fetch_logs 
                WHERE created_at < datetime('now', '-30 days')
            `).run();

            // Limpiar noticias antiguas (más de 7 días)
            db.prepare(`
                DELETE FROM news_items 
                WHERE created_at < datetime('now', '-7 days')
            `).run();
        });

        const result = transaction();
        console.log('🧹 Limpieza de datos antiguos completada');
        return result;
    } catch (error) {
        console.error('Error en limpieza de datos:', error);
        return null;
    }
}

export default {
    initDatabase,
    getDatabase,
    closeDatabase,
    transaction,
    getDatabaseStats,
    cleanupOldData
};
