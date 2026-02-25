-- =====================================================
-- RLS (Row Level Security) para TimeLine en Supabase
-- =====================================================
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.supabase.sql
--
-- El backend usa SUPABASE_SERVICE_ROLE_KEY: esa clave BYPASEA RLS y siempre
-- tiene acceso. Este script activa RLS en el schema public y crea políticas
-- que permiten solo al role service_role. Los roles anon y authenticated
-- no tienen políticas propias, así que no podrán leer ni modificar filas.
-- Esto corrige el aviso "RLS Disabled in Public" de Supabase.
-- =====================================================

-- ---------------------------------------------------------------------------
-- Si npm run create-admin da "new row violates row-level security policy":
-- el backend está usando la clave ANON en lugar de SERVICE_ROLE. En .env
-- pon SUPABASE_SERVICE_ROLE_KEY con la clave "service_role" (secret) de
-- Dashboard > Project Settings > API, no la clave "anon" (public).
-- ---------------------------------------------------------------------------
-- REMEDIACIÓN RÁPIDA: si Supabase te avisa "RLS Disabled" en public.news_sources,
-- ejecuta solo estas dos líneas en el SQL Editor y vuelve a comprobar:
--
--   ALTER TABLE "public"."news_sources" ENABLE ROW LEVEL SECURITY;
--   CREATE POLICY "Backend full access" ON "public"."news_sources"
--     FOR ALL TO service_role USING (true) WITH CHECK (true);
--
-- Si la política ya existía (error "already exists"), bórrala antes:
--   DROP POLICY IF EXISTS "Backend full access" ON "public"."news_sources";
-- ---------------------------------------------------------------------------

-- Habilitar RLS en todas las tablas (schema public explícito)
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."news_sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."news_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_custom_sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."fetch_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."source_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_topic_follows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_saved_news" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_read_news" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."source_lists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."source_list_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_news_clicks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."email_verifications" ENABLE ROW LEVEL SECURITY;

-- Políticas: solo service_role (backend) tiene acceso. anon/authenticated no tienen
-- ninguna política, así que no pueden leer ni escribir. service_role en Supabase
-- bypasea RLS por defecto; estas políticas documentan el modelo de seguridad.
-- (DROP IF EXISTS permite re-ejecutar el script sin error de política duplicada.)
DROP POLICY IF EXISTS "Backend full access" ON "public"."users";
DROP POLICY IF EXISTS "Backend full access" ON "public"."news_sources";
DROP POLICY IF EXISTS "Backend full access" ON "public"."news_items";
DROP POLICY IF EXISTS "Backend full access" ON "public"."user_sources";
DROP POLICY IF EXISTS "Backend full access" ON "public"."user_custom_sources";
DROP POLICY IF EXISTS "Backend full access" ON "public"."user_preferences";
DROP POLICY IF EXISTS "Backend full access" ON "public"."fetch_logs";
DROP POLICY IF EXISTS "Backend full access" ON "public"."sessions";
DROP POLICY IF EXISTS "Backend full access" ON "public"."source_categories";
DROP POLICY IF EXISTS "Backend full access" ON "public"."user_topic_follows";
DROP POLICY IF EXISTS "Backend full access" ON "public"."user_saved_news";
DROP POLICY IF EXISTS "Backend full access" ON "public"."user_read_news";
DROP POLICY IF EXISTS "Backend full access" ON "public"."source_lists";
DROP POLICY IF EXISTS "Backend full access" ON "public"."source_list_items";
DROP POLICY IF EXISTS "Backend full access" ON "public"."user_news_clicks";
DROP POLICY IF EXISTS "Backend full access" ON "public"."error_logs";
DROP POLICY IF EXISTS "Backend full access" ON "public"."email_verifications";

CREATE POLICY "Backend full access" ON "public"."users" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend full access" ON "public"."news_sources" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend full access" ON "public"."news_items" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend full access" ON "public"."user_sources" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend full access" ON "public"."user_custom_sources" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend full access" ON "public"."user_preferences" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend full access" ON "public"."fetch_logs" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend full access" ON "public"."sessions" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend full access" ON "public"."source_categories" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend full access" ON "public"."user_topic_follows" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend full access" ON "public"."user_saved_news" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend full access" ON "public"."user_read_news" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend full access" ON "public"."source_lists" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend full access" ON "public"."source_list_items" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend full access" ON "public"."user_news_clicks" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend full access" ON "public"."error_logs" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend full access" ON "public"."email_verifications" FOR ALL TO service_role USING (true) WITH CHECK (true);
