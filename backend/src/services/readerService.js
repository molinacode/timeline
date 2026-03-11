import axios from 'axios'
import * as cheerio from 'cheerio'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36'
const FETCH_OPTIONS = { headers: { 'User-Agent': USER_AGENT }, timeout: 5000 }

/**
 * Obtiene la URL AMP si la página enlaza con rel="amphtml".
 * @param {string} html - HTML de la página canónica
 * @param {string} baseUrl - URL de la página (para resolver relativos)
 * @returns {string|null} URL absoluta de la versión AMP o null
 */
function getAmpUrlFromHtml(html, baseUrl) {
  const $ = cheerio.load(html)
  const href = $('link[rel="amphtml"]').attr('href')
  if (!href || !href.trim()) return null
  try {
    return new URL(href.trim(), baseUrl).href
  } catch {
    return null
  }
}

/**
 * Extrae el cuerpo del artículo desde HTML (Readability + fallbacks).
 * @param {string} html
 * @param {string} baseUrl - para JSDOM
 * @returns {{ contentHtml: string }}
 */
function extractContentFromHtml(html, baseUrl) {
  const $ = cheerio.load(html)
  let contentHtml = ''

  try {
    const dom = new JSDOM(html, { url: baseUrl })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()
    if (article && article.content && article.content.length > 100) {
      contentHtml = article.content
    }
  } catch (err) {
    // seguir con fallbacks
  }

  if (!contentHtml) {
    contentHtml =
      $('article').first().html() ||
      $('main').first().html() ||
      $('.article-body').first().html() ||
      $('.article-body__content').first().html() ||
      $('.post-content').first().html() ||
      $('.entry-content').first().html() ||
      $('[itemprop="articleBody"]').first().html() ||
      ''
  }

  return { contentHtml: contentHtml || '' }
}

export async function extractArticleFromUrl(url) {
  const response = await axios.get(url, FETCH_OPTIONS)
  const html = response.data
  const $ = cheerio.load(html)

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('title').first().text().trim() ||
    ''

  const ogImage =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    null

  const description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    ''

  let contentHtml = ''
  const fromCanonical = extractContentFromHtml(html, url)
  contentHtml = fromCanonical.contentHtml

  // Si el contenido canónico es pobre, intentar versión AMP (suele ser más limpia)
  const ampUrl = getAmpUrlFromHtml(html, url)
  if (ampUrl && ampUrl !== url && (!contentHtml || contentHtml.length < 500)) {
    try {
      const ampResponse = await axios.get(ampUrl, FETCH_OPTIONS)
      const fromAmp = extractContentFromHtml(ampResponse.data, ampUrl)
      if (fromAmp.contentHtml && fromAmp.contentHtml.length > contentHtml.length) {
        contentHtml = fromAmp.contentHtml
      }
    } catch (err) {
      // usar lo que ya tenemos del canónico
    }
  }

  return {
    title,
    description,
    image: ogImage,
    contentHtml,
  }
}


