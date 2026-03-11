/**
 * Obtiene XML de una URL con axios y lo parsea con rss-parser.parseString.
 * Evita parser.parseURL() para no disparar el aviso DEP0169 (url.parse deprecado)
 * que lanza Node al usar el módulo http con URL string.
 */
import axios from 'axios'
import Parser from 'rss-parser'

const DEFAULT_OPTIONS = {
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (compatible; TimeLineRSS/1.0; +https://github.com/timeline)',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
  },
}

/**
 * Descarga el feed RSS desde url y lo parsea con rss-parser.
 * @param {string} url - URL del feed RSS
 * @param {{ timeout?: number, headers?: Record<string, string> }} [options]
 * @returns {Promise<import('rss-parser').Output>}
 */
export async function fetchAndParseRss(url, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const res = await axios.get(url, {
    timeout: opts.timeout ?? 15000,
    headers: opts.headers ?? DEFAULT_OPTIONS.headers,
    maxRedirects: 5,
    responseType: 'text',
    validateStatus: (status) => status >= 200 && status < 300,
  })
  const parser = new Parser()
  const feed = await parser.parseString(res.data)
  return feed
}
