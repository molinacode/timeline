import axios from 'axios'
import * as cheerio from 'cheerio'
import { fetchFallbackImageFromHtml } from './imageExtractorService.js'

const REQUEST_TIMEOUT_MS = 12000

function getOrigin(url) {
  try {
    const u = new URL(url)
    return u.origin
  } catch {
    return null
  }
}

function extractTitle($) {
  const ogTitle =
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="og:title"]').attr('content')
  if (ogTitle && ogTitle.trim()) return ogTitle.trim()

  const twitterTitle =
    $('meta[name="twitter:title"]').attr('content') ||
    $('meta[property="twitter:title"]').attr('content')
  if (twitterTitle && twitterTitle.trim()) return twitterTitle.trim()

  const h1 = $('h1').first().text().trim()
  if (h1) return h1

  const title = $('title').first().text().trim()
  return title || null
}

function extractSite($, url) {
  const siteName =
    $('meta[property="og:site_name"]').attr('content') ||
    $('meta[name="application-name"]').attr('content')
  if (siteName && siteName.trim()) return siteName.trim()
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./i, '')
  } catch {
    return null
  }
}

function extractPubDate($) {
  const timeSelectors = [
    'meta[property="article:published_time"]',
    'meta[name="article:published_time"]',
    'meta[name="pubdate"]',
    'meta[name="date"]',
    'time[datetime]',
  ]
  for (const sel of timeSelectors) {
    const el = $(sel).first()
    const value = el.attr('content') || el.attr('datetime') || el.text()
    if (value && value.trim()) {
      const iso = new Date(value.trim())
      if (!Number.isNaN(iso.getTime())) return iso.toISOString()
    }
  }
  return null
}

function pickMainContainer($) {
  const candidates = [
    'article',
    'main',
    '.article-body',
    '.article__content',
    '.post-content',
    '.entry-content',
    '.content',
  ]

  let bestNode = null
  let bestScore = 0

  candidates.forEach((selector) => {
    $(selector).each((_, el) => {
      const node = $(el)
      const text = node.text() || ''
      const score = text.replace(/\s+/g, ' ').trim().length
      if (score > bestScore) {
        bestScore = score
        bestNode = node
      }
    })
  })

  if (!bestNode) {
    const body = $('body')
    if (!body || body.length === 0) return null
    return body
  }

  return bestNode
}

function sanitizeArticleHtml($, node) {
  // Clonar nodo para no tocar el DOM original
  const cloned = node.clone()
  cloned.find('script, style, noscript, iframe, form, nav, header, footer').remove()
  // Remove inline event handlers
  cloned.find('*').each((_, el) => {
    const attrs = el.attribs || {}
    Object.keys(attrs).forEach((name) => {
      if (/^on/i.test(name)) {
        delete el.attribs[name]
      }
    })
  })
  return cloned.html() || ''
}

export async function fetchArticleForReader(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('URL inválida')
  }

  let finalUrl = url

  try {
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT_MS,
      maxRedirects: 5,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 TimeLineReader/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      validateStatus: (status) => status >= 200 && status < 400,
    })

    finalUrl = response.request?.res?.responseUrl || response.request?.path || url

    const html = response.data
    const $ = cheerio.load(html)

    const title = extractTitle($)
    const site = extractSite($, finalUrl)
    const pubDate = extractPubDate($)

    let image =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[property="twitter:image"]').attr('content') ||
      null

    const mainNode = pickMainContainer($)
    const contentHtml = mainNode ? sanitizeArticleHtml($, mainNode) : ''

    if (!image) {
      try {
        image = await fetchFallbackImageFromHtml(finalUrl)
      } catch {
        // ignorar
      }
    }

    return {
      title: title || null,
      contentHtml: contentHtml || null,
      image: image || null,
      source: site || null,
      site: site || null,
      pubDate,
      url: finalUrl,
    }
  } catch (err) {
    console.error('[readerService] Error obteniendo artículo para lector:', url, err.message)
    throw new Error('No se pudo obtener el contenido del artículo')
  }
}

