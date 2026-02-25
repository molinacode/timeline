import Parser from 'rss-parser';
import { parseStringPromise } from 'xml2js';
import {
  fetchRtveProgramCatalog,
  filterNewsPrograms,
  buildRtveNewsFeeds
} from './rtveProgramsService.js';

const parser = new Parser();

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

// Caché simple en memoria por feedUrl
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const feedCache = new Map(); // feedUrl -> { timestamp, items }

// Métricas de salud por feedUrl
const feedMetrics = new Map(); // feedUrl -> { totalRequests, successCount, failureCount, lastSuccessAt, lastFailureAt, lastError }

function recordSuccess(feedUrl) {
  const now = new Date().toISOString();
  const m = feedMetrics.get(feedUrl) || {
    totalRequests: 0,
    successCount: 0,
    failureCount: 0,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastError: null
  };
  m.totalRequests += 1;
  m.successCount += 1;
  m.lastSuccessAt = now;
  m.lastError = null;
  feedMetrics.set(feedUrl, m);
}

function recordFailure(feedUrl, error) {
  const now = new Date().toISOString();
  const m = feedMetrics.get(feedUrl) || {
    totalRequests: 0,
    successCount: 0,
    failureCount: 0,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastError: null
  };
  m.totalRequests += 1;
  m.failureCount += 1;
  m.lastFailureAt = now;
  m.lastError = error.message || String(error);
  feedMetrics.set(feedUrl, m);
}

async function fetchRtveRssXml(url) {
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        TIMEOUT_MS
      );

      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept:
            'application/rss+xml, application/xml, text/xml, */*;q=0.9',
          'Accept-Language': 'es-ES,es;q=0.9',
          'Accept-Encoding': 'gzip, deflate',
          Connection: 'keep-alive',
          'Cache-Control': 'no-cache'
        },
        redirect: 'follow',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const contentType =
        res.headers.get('content-type')?.toLowerCase() || '';
      const isXml =
        contentType.includes('xml') || contentType.includes('rss');

      if (!isXml) {
        const preview = (await res.text()).substring(0, 200);
        throw new Error(
          `Contenido no XML. Tipo: ${contentType}. Preview: ${preview}`
        );
      }

      const xmlText = await res.text();
      await parseStringPromise(xmlText, { trim: true });
      return xmlText;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) =>
          setTimeout(r, RETRY_DELAY_MS * (attempt + 1))
        );
      }
    }
  }

  throw new Error(
    `Todos los intentos fallaron para RTVE RSS ${url}: ${lastError?.message}`
  );
}

async function parseSingleRtveFeed(feed) {
  const cacheEntry = feedCache.get(feed.feedUrl);
  const now = Date.now();

  if (cacheEntry && now - cacheEntry.timestamp < CACHE_TTL_MS) {
    recordSuccess(feed.feedUrl);
    return cacheEntry.items;
  }

  try {
    const xmlText = await fetchRtveRssXml(feed.feedUrl);
    const parsed = await parser.parseString(xmlText);

    const items =
      (parsed.items || []).map((item) => ({
        title: item.title || '',
        link: item.link || '',
        description:
          item.contentSnippet || item.content || item.description || '',
        pubDate: item.pubDate || '',
        isoDate: item.isoDate || '',
        image: item.enclosure?.url || item['media:content']?.url || null,
        programName: feed.programName,
        source: 'RTVE'
      })) || [];

    feedCache.set(feed.feedUrl, {
      timestamp: now,
      items
    });
    recordSuccess(feed.feedUrl);
    return items;
  } catch (error) {
    recordFailure(feed.feedUrl, error);
    throw error;
  }
}

export async function fetchAggregatedRtveNews() {
  const catalog = await fetchRtveProgramCatalog();
  const newsPrograms = filterNewsPrograms(catalog);
  const feeds = buildRtveNewsFeeds(newsPrograms);

  const allItems = [];

  const promises = feeds.map(async (feed) => {
    try {
      const items = await parseSingleRtveFeed(feed);
      return items;
    } catch {
      return [];
    }
  });

  const settled = await Promise.allSettled(promises);

  for (const r of settled) {
    if (r.status === 'fulfilled') {
      allItems.push(...r.value);
    }
  }

  return allItems.sort(
    (a, b) =>
      new Date(b.isoDate || b.pubDate || 0).getTime() -
      new Date(a.isoDate || a.pubDate || 0).getTime()
  );
}

export function getRtveFeedMetrics() {
  const result = [];
  for (const [feedUrl, m] of feedMetrics.entries()) {
    const successRate =
      m.totalRequests > 0
        ? m.successCount / m.totalRequests
        : null;
    result.push({
      feedUrl,
      totalRequests: m.totalRequests,
      successCount: m.successCount,
      failureCount: m.failureCount,
      lastSuccessAt: m.lastSuccessAt,
      lastFailureAt: m.lastFailureAt,
      lastError: m.lastError,
      successRate
    });
  }
  return result;
}


