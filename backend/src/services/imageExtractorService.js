import axios from 'axios'
import cheerio from 'cheerio'

const REQUEST_TIMEOUT_MS = 8000

function pickFromSrcset(srcset) {
  if (!srcset || typeof srcset !== 'string') return null
  const first = srcset.split(',')[0]?.trim()
  if (!first) return null
  const [url] = first.split(/\s+/)
  return url || null
}

export async function fetchFallbackImageFromHtml(pageUrl) {
  if (!pageUrl) return null

  try {
    const response = await axios.get(pageUrl, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 TimeLineImageBot/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      maxRedirects: 3,
    })

    const html = response.data
    const $ = cheerio.load(html)

    const ogImage =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="og:image"]').attr('content')
    if (ogImage) return ogImage

    const twitterImage =
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[property="twitter:image"]').attr('content')
    if (twitterImage) return twitterImage

    const elPaisImg = $('span.a_m_w img, picture img').first()
    if (elPaisImg && elPaisImg.length > 0) {
      const srcset = elPaisImg.attr('srcset')
      const src = elPaisImg.attr('src')
      const picked = pickFromSrcset(srcset) || src
      if (picked) return picked
    }

    const featuredImg = $('figure.article-featured-image img').first()
    if (featuredImg && featuredImg.length > 0) {
      const srcset = featuredImg.attr('srcset')
      const src = featuredImg.attr('src')
      const picked = pickFromSrcset(srcset) || src
      if (picked) return picked
    }

    const postEntryImg = $('.post .entry img').first()
    if (postEntryImg && postEntryImg.length > 0) {
      const srcset = postEntryImg.attr('srcset')
      const src = postEntryImg.attr('src')
      const picked = pickFromSrcset(srcset) || src
      if (picked) return picked
    }

    const elementorImg = $('.elementor-widget-container img').first()
    if (elementorImg && elementorImg.length > 0) {
      const srcset = elementorImg.attr('srcset') || elementorImg.attr('data-lazy-srcset')
      const src =
        elementorImg.attr('src') ||
        elementorImg.attr('data-lazy-src') ||
        elementorImg.attr('data-src')
      const picked = pickFromSrcset(srcset) || src
      if (picked) return picked
    }

    const articleImg = $('article img').first()
    if (articleImg && articleImg.length > 0) {
      const srcset = articleImg.attr('srcset')
      const src = articleImg.attr('src')
      const picked = pickFromSrcset(srcset) || src
      if (picked) return picked
    }

    const genericImg = $('img').first()
    if (genericImg && genericImg.length > 0) {
      const srcset = genericImg.attr('srcset')
      const src = genericImg.attr('src')
      const picked = pickFromSrcset(srcset) || src
      if (picked) return picked
    }

    return null
  } catch (err) {
    console.error('[imageExtractor] Error obteniendo imagen de', pageUrl, err.message)
    return null
  }
}

