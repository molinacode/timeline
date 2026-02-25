-- Esquema principal de TimeLine (SQLite)

PRAGMA foreign_keys = ON;

-- 1. Usuarios
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  region TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  preferences TEXT, -- JSON
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login TEXT
);

-- 2. Fuentes de noticias
CREATE TABLE IF NOT EXISTS news_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  rss_url TEXT NOT NULL,
  website_url TEXT,
  category TEXT,
  region TEXT,
  description TEXT,
  logo_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_public INTEGER NOT NULL DEFAULT 1,
  priority INTEGER DEFAULT 0,
  topic_tags TEXT, -- JSON
  last_fetched TEXT,
  fetch_interval INTEGER, -- en minutos
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 3. Noticias
CREATE TABLE IF NOT EXISTS news_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  link TEXT NOT NULL,
  image_url TEXT,
  pub_date TEXT,
  guid TEXT,
  category TEXT,
  region TEXT,
  tags TEXT, -- JSON
  topic_tags TEXT, -- JSON
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_last_hour INTEGER NOT NULL DEFAULT 0,
  is_highlighted INTEGER NOT NULL DEFAULT 0,
  relevance_score REAL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (source_id) REFERENCES news_sources(id) ON DELETE CASCADE
);

-- 4. Fuentes de usuarios
CREATE TABLE IF NOT EXISTS user_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  source_id INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES news_sources(id) ON DELETE CASCADE
);

-- 5. Fuentes personalizadas de usuarios
CREATE TABLE IF NOT EXISTS user_custom_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  rss_url TEXT NOT NULL,
  category TEXT,
  region TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Preferencias de usuarios
CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  theme TEXT,
  language TEXT,
  region TEXT,
  categories TEXT, -- JSON
  sources TEXT, -- JSON
  notifications INTEGER NOT NULL DEFAULT 1,
  email_notifications INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Registro de obtención de noticias
CREATE TABLE IF NOT EXISTS fetch_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  items_fetched INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  fetch_duration INTEGER, -- ms
  created_at TEXT NOT NULL,
  FOREIGN KEY (source_id) REFERENCES news_sources(id) ON DELETE CASCADE
);

-- 8. Sesiones de usuarios
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Categorías temáticas
CREATE TABLE IF NOT EXISTS source_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  description TEXT,
  created_at TEXT NOT NULL
);

-- 10. Temas seguidos por los usuarios
CREATE TABLE IF NOT EXISTS user_topic_follows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  topic TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 11. Noticias guardadas por los usuarios
CREATE TABLE IF NOT EXISTS user_saved_news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  news_id INTEGER NOT NULL,
  saved_at TEXT NOT NULL,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (news_id) REFERENCES news_items(id) ON DELETE CASCADE
);

-- 12. Historial de noticias leídas
CREATE TABLE IF NOT EXISTS user_read_news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  news_id INTEGER NOT NULL,
  read_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (news_id) REFERENCES news_items(id) ON DELETE CASCADE
);

-- 13. Listas personalizadas de fuentes
CREATE TABLE IF NOT EXISTS source_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 14. Fuentes en lista
CREATE TABLE IF NOT EXISTS source_list_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL,
  source_id INTEGER,
  custom_source_id INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (list_id) REFERENCES source_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES news_sources(id) ON DELETE SET NULL,
  FOREIGN KEY (custom_source_id) REFERENCES user_custom_sources(id) ON DELETE SET NULL
);

-- 15a. Clics de usuarios en noticias (para métricas)
CREATE TABLE IF NOT EXISTS user_news_clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  source_name TEXT NOT NULL,
  link TEXT,
  clicked_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 15. Registro de errores HTTP
CREATE TABLE IF NOT EXISTS error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  error_message TEXT,
  user_agent TEXT,
  ip_address TEXT,
  duration_ms INTEGER,
  created_at TEXT NOT NULL
);

