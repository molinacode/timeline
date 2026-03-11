// Script para importar secciones de El Mundo (y otros índices RSS similares)
// en la tabla news_sources usando el índice de RSS.
//
// Uso:
//   cd backend
//   node ../scripts/importElMundoSources.js
//
// Requisitos:
//   - Variables SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY configuradas (.env)
//   - Dependencias de backend instaladas (rss-parser)

import { createRequire } from 'module'
import { getSupabase } from '../backend/src/config/supabase.js'

const require = createRequire(import.meta.url)
// Cargamos rss-parser desde el backend para reutilizar sus dependencias
// (el script se ejecuta desde /backend, así que este path es estable).
const Parser = require('../backend/node_modules/rss-parser')

const INDEX_URL =
  process.env.ELMUNDO_RSS_INDEX_URL ||
  'https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml'

async function discoverChildFeeds(indexUrl) {
  const parser = new Parser({
    timeout: 10000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; TimeLineRSS/1.0; +https://github.com/timeline)',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
  })

  console.log(`[ElMundoImport] Leyendo índice RSS desde: ${indexUrl}`)
  const feed = await parser.parseURL(indexUrl)

  const items = (feed.items || []).map((item) => ({
    title: (item.title || '').trim(),
    rssUrl: (item.link || '').trim(),
  }))

  return items.filter((it) => it.rssUrl && it.rssUrl.includes('/rss/'))
}

async function importSourcesFromIndex(indexUrl) {
  const supabase = getSupabase()
  const childFeeds = await discoverChildFeeds(indexUrl)

  if (!childFeeds.length) {
    console.log('[ElMundoImport] No se han encontrado feeds hijos en el índice.')
    return
  }

  console.log(
    `[ElMundoImport] Encontradas ${childFeeds.length} secciones. Importando a news_sources...`
  )

  let imported = 0
  for (const feed of childFeeds) {
    const name = `El Mundo - ${feed.title || 'Sección'}`

    const { data: existing, error: selectError } = await supabase
      .from('news_sources')
      .select('id, name, rss_url')
      .eq('rss_url', feed.rssUrl)
      .limit(1)
      .maybeSingle()

    if (selectError) {
      console.error(
        `[ElMundoImport] Error comprobando existencia de ${feed.rssUrl}:`,
        selectError.message
      )
      continue
    }

    if (existing && existing.id) {
      console.log(`[ElMundoImport] Ya existía fuente para ${feed.rssUrl} (id=${existing.id})`)
      continue
    }

    const now = new Date().toISOString()
    const { error: insertError } = await supabase.from('news_sources').insert({
      name,
      rss_url: feed.rssUrl,
      website_url: feed.rssUrl.replace(/\/rss.*/, ''),
      category: 'Actualidad',
      region: null,
      description: null,
      logo_url: null,
      is_active: true,
      is_public: true,
      priority: 0,
      topic_tags: null,
      last_fetched: null,
      fetch_interval: null,
      created_at: now,
      updated_at: now,
    })

    if (insertError) {
      console.error(
        `[ElMundoImport] Error insertando fuente para ${feed.rssUrl}:`,
        insertError.message
      )
      continue
    }

    imported += 1
    console.log(`[ElMundoImport] Fuente creada: ${name} -> ${feed.rssUrl}`)
  }

  console.log(
    `[ElMundoImport] Importación finalizada. Fuentes nuevas creadas: ${imported}/${childFeeds.length}`
  )
}

;(async () => {
  try {
    await importSourcesFromIndex(INDEX_URL)
    process.exit(0)
  } catch (err) {
    console.error('[ElMundoImport] Error general:', err.message)
    process.exit(1)
  }
})()

