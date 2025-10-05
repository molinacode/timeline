-- =====================================================
-- TimeLine RSS Aggregator - Database Schema
-- =====================================================
-- Este archivo contiene el esquema completo de la base de datos
-- para el agregador de noticias RSS TimeLine

-- Crear base de datos (para MySQL/PostgreSQL)
-- CREATE DATABASE timeline_db;
-- USE timeline_db;

-- =====================================================
-- TABLA: users
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    region VARCHAR(50),
    preferences JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- TABLA: news_sources
-- =====================================================
CREATE TABLE IF NOT EXISTS news_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    rss_url VARCHAR(500) NOT NULL,
    website_url VARCHAR(500),
    category ENUM('conservative', 'centrist', 'progressive', 'regional') NOT NULL,
    region VARCHAR(50),
    description TEXT,
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    last_fetched DATETIME,
    fetch_interval INTEGER DEFAULT 300, -- segundos
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: news_items
-- =====================================================
CREATE TABLE IF NOT EXISTS news_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content TEXT,
    link VARCHAR(500) NOT NULL,
    image_url VARCHAR(500),
    pub_date DATETIME NOT NULL,
    guid VARCHAR(255),
    category ENUM('conservative', 'centrist', 'progressive', 'regional') NOT NULL,
    region VARCHAR(50),
    tags JSON,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES news_sources(id) ON DELETE CASCADE,
    UNIQUE(guid, source_id)
);

-- =====================================================
-- TABLA: user_sources
-- =====================================================
CREATE TABLE IF NOT EXISTS user_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    source_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (source_id) REFERENCES news_sources(id) ON DELETE CASCADE,
    UNIQUE(user_id, source_id)
);

-- =====================================================
-- TABLA: user_custom_sources
-- =====================================================
CREATE TABLE IF NOT EXISTS user_custom_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    rss_url VARCHAR(500) NOT NULL,
    category ENUM('conservative', 'centrist', 'progressive', 'regional') NOT NULL,
    region VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA: user_preferences
-- =====================================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    theme ENUM('light', 'dark') DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'es',
    region VARCHAR(50),
    categories JSON, -- Array de categorías preferidas
    sources JSON, -- Array de IDs de fuentes preferidas
    notifications BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id)
);

-- =====================================================
-- TABLA: fetch_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS fetch_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    status ENUM('success', 'error', 'timeout') NOT NULL,
    items_fetched INTEGER DEFAULT 0,
    error_message TEXT,
    fetch_duration INTEGER, -- milisegundos
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES news_sources(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA: sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Índices para news_sources
CREATE INDEX IF NOT EXISTS idx_sources_category ON news_sources(category);
CREATE INDEX IF NOT EXISTS idx_sources_region ON news_sources(region);
CREATE INDEX IF NOT EXISTS idx_sources_active ON news_sources(is_active);

-- Índices para news_items
CREATE INDEX IF NOT EXISTS idx_items_source_id ON news_items(source_id);
CREATE INDEX IF NOT EXISTS idx_items_pub_date ON news_items(pub_date);
CREATE INDEX IF NOT EXISTS idx_items_category ON news_items(category);
CREATE INDEX IF NOT EXISTS idx_items_region ON news_items(region);
CREATE INDEX IF NOT EXISTS idx_items_featured ON news_items(is_featured);

-- Índices para user_sources
CREATE INDEX IF NOT EXISTS idx_user_sources_user_id ON user_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sources_source_id ON user_sources(source_id);

-- Índices para fetch_logs
CREATE INDEX IF NOT EXISTS idx_fetch_logs_source_id ON fetch_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_fetch_logs_created_at ON fetch_logs(created_at);

-- Índices para sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- =====================================================
-- TRIGGERS PARA ACTUALIZAR updated_at
-- =====================================================

-- Trigger para users
CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Trigger para news_sources
CREATE TRIGGER IF NOT EXISTS update_news_sources_updated_at 
    AFTER UPDATE ON news_sources
    FOR EACH ROW
    BEGIN
        UPDATE news_sources SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Trigger para news_items
CREATE TRIGGER IF NOT EXISTS update_news_items_updated_at 
    AFTER UPDATE ON news_items
    FOR EACH ROW
    BEGIN
        UPDATE news_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Trigger para user_custom_sources
CREATE TRIGGER IF NOT EXISTS update_user_custom_sources_updated_at 
    AFTER UPDATE ON user_custom_sources
    FOR EACH ROW
    BEGIN
        UPDATE user_custom_sources SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Trigger para user_preferences
CREATE TRIGGER IF NOT EXISTS update_user_preferences_updated_at 
    AFTER UPDATE ON user_preferences
    FOR EACH ROW
    BEGIN
        UPDATE user_preferences SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para noticias con información de fuente
CREATE VIEW IF NOT EXISTS news_with_sources AS
SELECT 
    ni.*,
    ns.name as source_name,
    ns.website_url as source_website,
    ns.logo_url as source_logo
FROM news_items ni
JOIN news_sources ns ON ni.source_id = ns.id;

-- Vista para estadísticas de fuentes
CREATE VIEW IF NOT EXISTS source_stats AS
SELECT 
    ns.id,
    ns.name,
    ns.category,
    ns.region,
    COUNT(ni.id) as total_items,
    COUNT(CASE WHEN ni.created_at >= datetime('now', '-24 hours') THEN 1 END) as items_last_24h,
    MAX(ni.pub_date) as last_item_date,
    ns.last_fetched
FROM news_sources ns
LEFT JOIN news_items ni ON ns.id = ni.source_id
GROUP BY ns.id, ns.name, ns.category, ns.region, ns.last_fetched;

-- =====================================================
-- DATOS INICIALES (SEED DATA)
-- =====================================================

-- Insertar fuentes de noticias por defecto
INSERT OR IGNORE INTO news_sources (name, rss_url, category, region, description, is_active) VALUES
-- Fuentes Conservadoras
('ABC', 'https://www.abc.es/rss/feeds/abc_ultima.xml', 'conservative', NULL, 'Diario conservador español', TRUE),
('La Razón', 'https://www.larazon.es/rss/portada.xml', 'conservative', NULL, 'Periódico conservador', TRUE),
('OK Diario', 'https://okdiario.com/feed', 'conservative', NULL, 'Medio digital conservador', TRUE),
('El Debate', 'https://www.eldebate.com/rss/portada.xml', 'conservative', NULL, 'Periódico conservador', TRUE),
('Voz Populi', 'https://www.vozpopuli.com/rss/portada.xml', 'conservative', NULL, 'Medio digital conservador', TRUE),
('Libertad Digital', 'https://www.libertaddigital.com/rss/portada.xml', 'conservative', NULL, 'Medio digital conservador', TRUE),
('El Independiente', 'https://www.elindependiente.com/rss/portada.xml', 'conservative', NULL, 'Periódico conservador', TRUE),
('Cadena COPE', 'https://www.cope.es/rss/portada.xml', 'conservative', NULL, 'Radio conservadora', TRUE),

-- Fuentes Centristas
('El Mundo', 'https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml', 'centrist', NULL, 'Periódico centrista', TRUE),
('20 Minutos', 'https://www.20minutos.es/rss/portada.xml', 'centrist', NULL, 'Periódico gratuito', TRUE),
('El Confidencial', 'https://www.elconfidencial.com/rss/portada.xml', 'centrist', NULL, 'Medio digital centrista', TRUE),
('El Español', 'https://www.elespanol.com/rss/portada.xml', 'centrist', NULL, 'Periódico digital centrista', TRUE),
('Nius Diario', 'https://www.niusdiario.es/rss/portada.xml', 'centrist', NULL, 'Medio digital centrista', TRUE),
('Estrella Digital', 'https://www.estrelladigital.es/rss/portada.xml', 'centrist', NULL, 'Medio digital centrista', TRUE),
('Diario Crítico', 'https://www.diariocritico.com/rss/portada.xml', 'centrist', NULL, 'Medio digital centrista', TRUE),
('El Liberal', 'https://www.elliberal.com/rss/portada.xml', 'centrist', NULL, 'Medio digital centrista', TRUE),

-- Fuentes Progresistas
('El País', 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada', 'progressive', NULL, 'Periódico progresista', TRUE),
('El Diario', 'https://www.eldiario.es/rss/portada.xml', 'progressive', NULL, 'Medio digital progresista', TRUE),
('Infolibre', 'https://www.infolibre.es/rss/portada.xml', 'progressive', NULL, 'Medio digital progresista', TRUE),
('Cadena SER', 'https://play.cadenaser.com/rss/portada.xml', 'progressive', NULL, 'Radio progresista', TRUE),
('RTVE', 'https://www.rtve.es/rss/portada.xml', 'progressive', NULL, 'Televisión pública', TRUE),
('Público', 'https://www.publico.es/rss/portada.xml', 'progressive', NULL, 'Periódico progresista', TRUE),
('Nueva Tribuna', 'https://www.nuevatribuna.es/rss/portada.xml', 'progressive', NULL, 'Medio digital progresista', TRUE),
('CTXT', 'https://ctxt.es/rss/portada.xml', 'progressive', NULL, 'Medio digital progresista', TRUE),

-- Fuentes Regionales - Andalucía
('Diario de Sevilla', 'https://www.diariodesevilla.es/rss.xml', 'regional', 'andalucia', 'Periódico andaluz', TRUE),
('Diario de Cádiz', 'https://www.diariodecadiz.es/rss.xml', 'regional', 'andalucia', 'Periódico andaluz', TRUE),
('Ideal', 'https://www.ideal.es/rss.xml', 'regional', 'andalucia', 'Periódico andaluz', TRUE),

-- Fuentes Regionales - Madrid
('Madridiario', 'https://www.madridiario.es/rss.xml', 'regional', 'madrid', 'Periódico madrileño', TRUE),
('Telemadrid', 'https://www.telemadrid.es/rss.xml', 'regional', 'madrid', 'Televisión madrileña', TRUE),

-- Fuentes Regionales - Cataluña
('La Vanguardia', 'https://www.lavanguardia.com/rss.xml', 'regional', 'cataluna', 'Periódico catalán', TRUE),
('El Periódico', 'https://www.elperiodico.com/rss.xml', 'regional', 'cataluna', 'Periódico catalán', TRUE),

-- Fuentes Regionales - País Vasco
('El Correo', 'https://www.elcorreo.com/rss.xml', 'regional', 'paisvasco', 'Periódico vasco', TRUE),
('Deia', 'https://www.deia.eus/rss.xml', 'regional', 'paisvasco', 'Periódico vasco', TRUE),

-- Fuentes Regionales - Valencia
('Levante', 'https://www.levante-emv.com/rss.xml', 'regional', 'valencia', 'Periódico valenciano', TRUE),
('Las Provincias', 'https://www.lasprovincias.es/rss.xml', 'regional', 'valencia', 'Periódico valenciano', TRUE);

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
ESTRUCTURA DE LA BASE DE DATOS:

1. users: Usuarios del sistema
2. news_sources: Fuentes RSS configuradas
3. news_items: Noticias almacenadas
4. user_sources: Relación usuarios-fuentes
5. user_custom_sources: Fuentes personalizadas de usuarios
6. user_preferences: Preferencias de usuario
7. fetch_logs: Logs de obtención de noticias
8. sessions: Sesiones de usuario

CARACTERÍSTICAS:
- Soporte para SQLite (desarrollo) y MySQL/PostgreSQL (producción)
- Índices optimizados para consultas frecuentes
- Triggers para actualización automática de timestamps
- Vistas para consultas complejas
- Datos iniciales incluidos
- Relaciones con integridad referencial

USO:
- Para desarrollo: SQLite (archivo local)
- Para producción: MySQL o PostgreSQL
- Migración automática con scripts Node.js
*/
