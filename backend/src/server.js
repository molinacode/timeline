import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import cron from 'node-cron'
import newsRoutes from '../routes/news.js'
import sourcesRoutes from '../routes/sources.js'
import categoriesRoutes from '../routes/categories.js'
import authRoutes from '../routes/auth.js'
import rssMetricsRoutes from '../routes/rssMetrics.js'
import adminRoutes from '../routes/admin.js'
import userSourcesRoutes from '../routes/userSources.js'
import { fetchAllSourcesIntoNews } from './services/sourcesRssService.js'
import { fetchNewsByBiasMatched } from './services/fuentesBiasService.js'
import { getSupabase } from './config/supabase.js'
import {
  logger,
  errorHandler,
  notFoundHandler,
  securityHeaders,
} from '../middleware/errorHandler.js'

dotenv.config()

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())

app.use(logger)
app.use(securityHeaders)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api', newsRoutes)
app.use('/api', sourcesRoutes)
app.use('/api', categoriesRoutes)
app.use('/api', authRoutes)
app.use('/api', rssMetricsRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/me', userSourcesRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

const PORT = process.env.PORT || 3001
const RSS_FETCH_INTERVAL_MIN = Number(process.env.RSS_FETCH_INTERVAL) || 15
const BIAS_MATCHED_REFRESH_MIN = Number(process.env.BIAS_MATCHED_REFRESH_MIN || 30)

async function runRssFetch() {
  try {
    const result = await fetchAllSourcesIntoNews()
    console.log(
      `[RSS] Fuentes BD procesadas: ${result.sourcesProcessed}, noticias nuevas: ${result.itemsInserted}`
    )
  } catch (err) {
    console.error('[RSS] Error cargando noticias de fuentes:', err.message)
  }
}

async function refreshBiasMatchedSnapshot() {
  try {
    const supabase = getSupabase()
    const limit = 15
    const payload = await fetchNewsByBiasMatched(limit)
    await supabase.from('bias_matched_snapshots').insert({ payload })
    console.log('[BiasMatched] Snapshot actualizado correctamente')
  } catch (err) {
    console.error('[BiasMatched] Error refrescando snapshot:', err.message)
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend TimeLine escuchando en http://localhost:${PORT}`)
  console.log(
    `   Fuentes: BD (news_sources) · Por sesgo: fuentes-por-sesgo/*.json`
  )
  setImmediate(() => {
    runRssFetch().catch((err) => console.error('[RSS] Error:', err.message))
    refreshBiasMatchedSnapshot().catch((err) =>
      console.error('[BiasMatched] Error inicial:', err.message)
    )
  })

  cron.schedule(`*/${RSS_FETCH_INTERVAL_MIN} * * * *`, () =>
    runRssFetch().catch(() => {})
  )

  cron.schedule(`*/${BIAS_MATCHED_REFRESH_MIN} * * * *`, () =>
    refreshBiasMatchedSnapshot().catch(() => {})
  )
})
