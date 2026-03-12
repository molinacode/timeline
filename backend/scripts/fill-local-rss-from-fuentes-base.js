import fs from 'fs'
import path from 'path'

function normalizeDomain(url) {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./i, '').toLowerCase()
  } catch {
    return null
  }
}

function loadJson(p) {
  const raw = fs.readFileSync(p, 'utf8')
  return JSON.parse(raw)
}

function main() {
  const projectRoot = process.cwd()
  const fuentesPath = path.join(projectRoot, 'data', 'fuentes-base.json')
  const localPath = path.join(projectRoot, 'data', 'sourcesByRegion.json')

  const fuentes = loadJson(fuentesPath)
  const local = loadJson(localPath)

  const baseSources = Array.isArray(fuentes.sources) ? fuentes.sources : []
  const domainToRss = new Map()

  for (const s of baseSources) {
    const d = normalizeDomain(s.url)
    const rss = s.rssUrl && String(s.rssUrl).trim() !== '' ? String(s.rssUrl).trim() : null
    if (d && rss && !domainToRss.has(d)) {
      domainToRss.set(d, rss)
    }
  }

  let updatedCount = 0
  let totalEmpty = 0

  for (const region of local.regions || []) {
    for (const s of region.sources || []) {
      if (s.rssUrl && String(s.rssUrl).trim() !== '') continue
      totalEmpty += 1
      const d = normalizeDomain(s.url)
      if (!d) continue
      const rss = domainToRss.get(d)
      if (rss) {
        s.rssUrl = rss
        updatedCount += 1
      }
    }
  }

  fs.writeFileSync(localPath, JSON.stringify(local, null, 2), 'utf8')

  console.log(
    `[fill-local-rss] Fuentes locales con rssUrl vacío: ${totalEmpty}, actualizadas con rssUrl de fuentes-base: ${updatedCount}`
  )
}

main()

