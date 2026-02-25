/**
 * Migración: añade columna bias a news_sources
 * Valores: 'progressive' | 'centrist' | 'conservative' | NULL
 */
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../timeline.db')

const db = new Database(dbPath)

try {
  const tableInfo = db.prepare('PRAGMA table_info(news_sources)').all()
  const hasBias = tableInfo.some((col) => col.name === 'bias')

  if (!hasBias) {
    db.prepare('ALTER TABLE news_sources ADD COLUMN bias TEXT').run()
    console.log('✓ Columna bias añadida a news_sources')
  } else {
    console.log('Columna bias ya existe')
  }
} catch (err) {
  console.error('Error en migración:', err.message)
  process.exit(1)
} finally {
  db.close()
}
