import axios from 'axios'
import * as cheerio from 'cheerio'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

export async function extractArticleFromUrl(url) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
    },
    timeout: 5000,
  })

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

  // 1) Intentar extraer con Readability (modo "artículo completo")
  let contentHtml = ''
  try {
    const dom = new JSDOM(html, { url })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()
    if (article && article.content) {
      contentHtml = article.content
    }
  } catch (err) {
    console.warn('Readability falló para URL', url, err?.message)
  }

  // 2) Fallback a heurísticas simples si Readability no devuelve nada útil
  if (!contentHtml) {
    const article =
      $('article').first().html() ||
      $('main').first().html() ||
      $('.article-body').first().html() ||
      $('.post-content').first().html() ||
      ''
    if (article) {
      contentHtml = article
    }
  }

  return {
    title,
    description,
    image: ogImage,
    contentHtml,
  }
}


