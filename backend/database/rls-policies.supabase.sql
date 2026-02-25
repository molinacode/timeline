-- =====================================================
-- RLS (Row Level Security) para TimeLine en Supabase
-- =====================================================
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.supabase.sql
--
-- El backend usa SUPABASE_SERVICE_ROLE_KEY: esa clave BYPASEA RLS y siempre
-- tiene acceso. Este script activa RLS y permite explícitamente al role
-- service_role para que, si en algún momento se evaluaran políticas,
-- el backend siga pudiendo hacer todo. La clave anon no tendrá acceso.
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE fetch_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_read_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_news_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Política: permitir todo al backend (service_role). USING para SELECT/UPDATE/DELETE,
-- WITH CHECK para INSERT/UPDATE.
CREATE POLICY "Backend full access" ON users FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Backend full access" ON news_sources FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Backend full access" ON news_items FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Backend full access" ON user_sources FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Backend full access" ON user_custom_sources FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Backend full access" ON user_preferences FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Backend full access" ON fetch_logs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Backend full access" ON sessions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Backend full access" ON source_categories FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Backend full access" ON user_topic_follows FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Backend full access" ON user_saved_news FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Backend full access" ON user_read_news FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Backend full access" ON source_lists FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Backend full access" ON source_list_items FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Backend full access" ON user_news_clicks FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Backend full access" ON error_logs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Backend full access" ON email_verifications FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
