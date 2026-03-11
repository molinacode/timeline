/**
 * Sincroniza la tabla news_sources de Supabase con backend/data/fuentes-base.json.
 * Uso: npm run sync-news-sources (desde la carpeta backend)
 */
import 'dotenv/config'
import { getSupabase } from '../src/config/supabase.js'
import { syncNewsSourcesFromJson } from '../src/services/syncNewsSourcesService.js'

async function main() {
  const supabase = getSupabase()
  const r = await syncNewsSourcesFromJson(supabase)
  console.log(
    `Sincronización: ${r.updated} actualizadas, ${r.inserted} nuevas. ` +
      `Fuentes activas: ${r.activeCount}. Desactivadas: ${r.deactivated}.`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
