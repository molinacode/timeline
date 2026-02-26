-- Esquema TimeLine para Supabase (PostgreSQL)
-- Ejecutar en el SQL Editor del proyecto Supabase

-- 1. Usuarios
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  region TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  preferences TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Campos para control de aceptación del acuerdo de uso
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS terms_version TEXT;

ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- 2. Fuentes de noticias (incluye bias para comparador por sesgo)
CREATE TABLE IF NOT EXISTS news_sources (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  rss_url TEXT NOT NULL,
  website_url TEXT,
  category TEXT,
  region TEXT,
  description TEXT,
  logo_url TEXT,
  bias TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER DEFAULT 0,
  topic_tags TEXT,
  last_fetched TIMESTAMPTZ,
  fetch_interval INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Noticias
CREATE TABLE IF NOT EXISTS news_items (
  id BIGSERIAL PRIMARY KEY,
  source_id BIGINT NOT NULL REFERENCES news_sources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  link TEXT NOT NULL,
  image_url TEXT,
  pub_date TIMESTAMPTZ,
  guid TEXT,
  category TEXT,
  region TEXT,
  tags TEXT,
  topic_tags TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_last_hour BOOLEAN NOT NULL DEFAULT false,
  is_highlighted BOOLEAN NOT NULL DEFAULT false,
  relevance_score REAL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Fuentes de usuarios
CREATE TABLE IF NOT EXISTS user_sources (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_id BIGINT NOT NULL REFERENCES news_sources(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Fuentes personalizadas de usuarios
CREATE TABLE IF NOT EXISTS user_custom_sources (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rss_url TEXT NOT NULL,
  category TEXT,
  region TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Preferencias de usuarios
CREATE TABLE IF NOT EXISTS user_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT,
  language TEXT,
  region TEXT,
  categories TEXT,
  sources TEXT,
  notifications INTEGER NOT NULL DEFAULT 1,
  email_notifications INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Registro de obtención de noticias
CREATE TABLE IF NOT EXISTS fetch_logs (
  id BIGSERIAL PRIMARY KEY,
  source_id BIGINT NOT NULL REFERENCES news_sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  items_fetched INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  fetch_duration INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Sesiones de usuarios
CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Categorías temáticas
CREATE TABLE IF NOT EXISTS source_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  description TEXT,
  is_special BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Temas seguidos por los usuarios
CREATE TABLE IF NOT EXISTS user_topic_follows (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Noticias guardadas por los usuarios
CREATE TABLE IF NOT EXISTS user_saved_news (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  news_id BIGINT NOT NULL REFERENCES news_items(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- 12. Historial de noticias leídas
CREATE TABLE IF NOT EXISTS user_read_news (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  news_id BIGINT NOT NULL REFERENCES news_items(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Listas personalizadas de fuentes
CREATE TABLE IF NOT EXISTS source_lists (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Fuentes en lista
CREATE TABLE IF NOT EXISTS source_list_items (
  id BIGSERIAL PRIMARY KEY,
  list_id BIGINT NOT NULL REFERENCES source_lists(id) ON DELETE CASCADE,
  source_id BIGINT REFERENCES news_sources(id) ON DELETE SET NULL,
  custom_source_id BIGINT REFERENCES user_custom_sources(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15a. Clics de usuarios en noticias (métricas)
CREATE TABLE IF NOT EXISTS user_news_clicks (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  link TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Registro de errores HTTP
CREATE TABLE IF NOT EXISTS error_logs (
  id BIGSERIAL PRIMARY KEY,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  error_message TEXT,
  user_agent TEXT,
  ip_address TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de verificación de email (antes creada en código)
CREATE TABLE IF NOT EXISTS email_verifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- 16. Snapshot del comparador por sesgo (bias-matched)
-- Guarda el resultado completo de fetchNewsByBiasMatched en JSONB para
-- servirlo rápido desde la API sin recalcular todos los RSS cada vez.
CREATE TABLE IF NOT EXISTS bias_matched_snapshots (
  id BIGSERIAL PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
