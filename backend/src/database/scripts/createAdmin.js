/**
 * Crea el usuario admin por defecto si no existe.
 * Sincroniza fuentes desde fuentes-base.json.
 * Uso: npm run create-admin (desde la carpeta backend)
 * Variables de entorno: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getSupabase } from '../../config/supabase.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@timeline.es'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'
const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrador'

const DEFAULT_SOURCES = [
  { name: 'El País', rssUrl: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada', websiteUrl: 'https://elpais.com', category: 'Actualidad' },
  { name: 'RTVE', rssUrl: 'https://www.rtve.es/api/noticias/rss/nacional', websiteUrl: 'https://www.rtve.es/noticias', category: 'Actualidad' },
  { name: 'El Mundo', rssUrl: 'https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml', websiteUrl: 'https://www.elmundo.es', category: 'Actualidad' },
  { name: 'ABC', rssUrl: 'https://www.abc.es/rss/abci-portada.xml', websiteUrl: 'https://www.abc.es', category: 'Actualidad' },
  { name: 'La Vanguardia', rssUrl: 'https://www.lavanguardia.com/rss/portada.xml', websiteUrl: 'https://www.lavanguardia.com', category: 'Actualidad' },
  { name: '20 Minutos', rssUrl: 'https://www.20minutos.es/rss/', websiteUrl: 'https://www.20minutos.es', category: 'Actualidad' },
  { name: 'Público', rssUrl: 'https://www.publico.es/rss/', websiteUrl: 'https://www.publico.es', category: 'Actualidad' },
]

function loadFuentesBase() {
  const candidates = [
    path.join(__dirname, '../../../data/fuentes-base.json'),
    path.join(process.cwd(), 'data/fuentes-base.json'),
    path.join(process.cwd(), 'backend/data/fuentes-base.json'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8')
      const data = JSON.parse(raw)
      return Array.isArray(data.sources) ? data.sources : []
    }
  }
  return []
}

async function ensureDefaultSources(supabase) {
  const { count, error: countError } = await supabase
    .from('news_sources')
    .select('id', { count: 'exact', head: true })

  if (countError) throw countError
  if (count > 0) {
    await syncFuentesBaseFromJson(supabase)
    return
  }

  const now = new Date().toISOString()
  const rows = DEFAULT_SOURCES.map((s) => ({
    name: s.name,
    rss_url: s.rssUrl,
    website_url: s.websiteUrl || null,
    category: s.category || null,
    is_active: true,
    is_public: true,
    created_at: now,
    updated_at: now,
  }))
  const { error: insertError } = await supabase.from('news_sources').insert(rows)
  if (insertError) throw insertError
  console.log(`✅ ${DEFAULT_SOURCES.length} fuentes RSS por defecto creadas.`)
}

async function syncFuentesBaseFromJson(supabase) {
  const sources = loadFuentesBase()
  if (sources.length === 0) return

  let added = 0
  for (const s of sources) {
    const rssUrl = s.rssUrl || s.rss_url
    if (!rssUrl) continue
    const { data: existing } = await supabase
      .from('news_sources')
      .select('id')
      .eq('rss_url', rssUrl)
      .maybeSingle()
    if (existing) continue

    const now = new Date().toISOString()
    await supabase.from('news_sources').insert({
      name: s.name || 'Sin nombre',
      rss_url: rssUrl,
      website_url: s.url || s.websiteUrl || null,
      category: s.category || 'Actualidad',
      is_active: true,
      is_public: true,
      created_at: now,
      updated_at: now,
    })
    added++
  }
  if (added > 0) {
    console.log(`✅ ${added} fuentes adicionales sincronizadas desde fuentes-base.json`)
  }
}

async function main() {
  const supabase = getSupabase()
  await ensureDefaultSources(supabase)

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', ADMIN_EMAIL)
    .maybeSingle()

  if (existing) {
    console.log(`✅ Usuario "${ADMIN_EMAIL}" ya existe.`)
    process.exit(0)
    return
  }

  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10)
  const now = new Date().toISOString()
  const { error: insertError } = await supabase.from('users').insert({
    email: ADMIN_EMAIL,
    password_hash: passwordHash,
    name: ADMIN_NAME,
    region: null,
    role: 'admin',
    preferences: JSON.stringify({}),
    is_active: true,
    created_at: now,
    updated_at: now,
    last_login: null,
  })

  if (insertError) throw insertError
  console.log(`✅ Usuario admin creado: ${ADMIN_EMAIL}`)
  console.log(`   (En desarrollo puedes iniciar sesión con: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD})`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
