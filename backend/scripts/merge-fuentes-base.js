/**
 * Fusiona fuentes-por-sesgo en fuentes-base.json
 * Ejecutar: node scripts/merge-fuentes-base.js
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const basePath = path.join(__dirname, '../data')

const base = JSON.parse(fs.readFileSync(path.join(basePath, 'fuentes-base.json'), 'utf8'))
const prog = JSON.parse(fs.readFileSync(path.join(basePath, 'fuentes-por-sesgo', 'progresistas.json'), 'utf8'))
const cent = JSON.parse(fs.readFileSync(path.join(basePath, 'fuentes-por-sesgo', 'centristas.json'), 'utf8'))
const cons = JSON.parse(fs.readFileSync(path.join(basePath, 'fuentes-por-sesgo', 'conservadoras.json'), 'utf8'))

const seen = new Set()
const out = []

for (const s of base.sources) {
  seen.add(s.id)
  out.push({ ...s, description: s.description || 'Diario' })
}

for (const s of [...prog.sources, ...cent.sources, ...cons.sources]) {
  if (!seen.has(s.id)) {
    seen.add(s.id)
    out.push({ id: s.id, name: s.name, url: s.url, rssUrl: s.rssUrl, description: 'Diario' })
  }
}

fs.writeFileSync(path.join(basePath, 'fuentes-base.json'), JSON.stringify({ sources: out }, null, 2))
console.log('Fusionadas', out.length, 'fuentes en fuentes-base.json')
