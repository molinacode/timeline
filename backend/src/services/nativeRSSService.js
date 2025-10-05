import { getDatabase } from '../config/database.js';
import type { NewsItem, NewsSource, ParsedNewsData } from '../types.js';

// =====================================================
// PARSER RSS NATIVO PARA BACKEND (NODE.JS)
// =====================================================

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const FETCH_TIMEOUT = 10000; // 10 segundos
const MAX_RETRIES = 3;

// Cache en memoria
const memoryCache = new Map<string, { data: ParsedNewsData; timestamp: number }>();

// =====================================================
// PROXIES PARA EVITAR CORS Y RESTRICCIONES
// =====================================================

const PROXY_SERVICES = [
    // Proxies públicos gratuitos
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
    (url: string) => `https://cors-anywhere.herokuapp.com/${url}`,
    
    // Último recurso: acceso directo
    (url: string) => url
];

// =====================================================
// FUNCIÓN PARA FETCH CON MÚLTIPLES PROXIES
// =====================================================

async function fetchWithProxies(url: string): Promise<string> {
    console.log(`🔄 Fetching RSS: ${url}`);
    
    for (let i = 0; i < PROXY_SERVICES.length; i++) {
        const proxyUrl = PROXY_SERVICES[i](url);
        
        try {
            console.log(`📡 Trying proxy ${i + 1}/${PROXY_SERVICES.length}: ${proxyUrl}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
            
            const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Cache-Control': 'no-cache'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                console.warn(`❌ Proxy ${i + 1} failed: ${response.status}`);
                continue;
            }
            
            const xmlText = await response.text();
            
            if (!xmlText || xmlText.trim().length === 0) {
                console.warn(`❌ Proxy ${i + 1} returned empty response`);
                continue;
            }
            
            // Verificar que sea XML válido
            if (isValidXML(xmlText)) {
                console.log(`✅ Success with proxy ${i + 1}`);
                return xmlText;
            } else {
                console.warn(`❌ Proxy ${i + 1} returned invalid XML`);
                continue;
            }
            
        } catch (error) {
            console.warn(`❌ Proxy ${i + 1} error:`, error instanceof Error ? error.message : error);
            continue;
        }
    }
    
    throw new Error('All proxies failed to fetch RSS feed');
}

// =====================================================
// VALIDACIÓN DE XML
// =====================================================

function isValidXML(xmlText: string): boolean {
    const trimmed = xmlText.trim();
    
    // Verificar que contenga elementos RSS o Atom
    const hasRSS = trimmed.includes('<rss') || trimmed.includes('<channel');
    const hasAtom = trimmed.includes('<feed') || trimmed.includes('<entry');
    const hasXML = trimmed.includes('<?xml') || trimmed.includes('<xml');
    
    if (!hasRSS && !hasAtom && !hasXML) {
        return false;
    }
    
    // Verificar que tenga items/entries
    const hasItems = trimmed.includes('<item') || trimmed.includes('<entry');
    
    return hasItems;
}

// =====================================================
// PARSER XML NATIVO CON REGEX (SIN LIBRERÍAS EXTERNAS)
// =====================================================

function parseXMLWithRegex(xmlText: string): ParsedNewsData {
    // Detectar tipo de feed
    const isRSS = xmlText.includes('<rss') || xmlText.includes('<channel');
    const isAtom = xmlText.includes('<feed');
    
    if (isRSS) {
        return parseRSSWithRegex(xmlText);
    } else if (isAtom) {
        return parseAtomWithRegex(xmlText);
    } else {
        throw new Error('Unknown feed format');
    }
}

// =====================================================
// PARSER RSS CON REGEX
// =====================================================

function parseRSSWithRegex(xmlText: string): ParsedNewsData {
    // Extraer información del canal
    const channelMatch = xmlText.match(/<channel[^>]*>([\s\S]*?)<\/channel>/i);
    if (!channelMatch) {
        throw new Error('No channel element found');
    }
    
    const channelContent = channelMatch[1];
    
    // Extraer título del canal
    const titleMatch = channelContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const feedTitle = titleMatch ? cleanText(titleMatch[1]) : 'Unknown Feed';
    
    // Extraer descripción del canal
    const descMatch = channelContent.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
    const feedDescription = descMatch ? cleanText(descMatch[1]) : '';
    
    // Extraer link del canal
    const linkMatch = channelContent.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const feedLink = linkMatch ? cleanText(linkMatch[1]) : '';
    
    console.log(`📰 Parsing RSS feed: ${feedTitle}`);
    
    // Extraer items
    const itemMatches = channelContent.match(/<item[^>]*>([\s\S]*?)<\/item>/gi);
    const newsItems: NewsItem[] = [];
    
    if (itemMatches) {
        itemMatches.forEach((itemContent, index) => {
            try {
                const newsItem = extractRSSItemWithRegex(itemContent, feedTitle);
                if (newsItem) {
                    newsItems.push(newsItem);
                }
            } catch (error) {
                console.warn(`⚠️ Error parsing item ${index}:`, error);
            }
        });
    }
    
    console.log(`✅ Parsed ${newsItems.length} items from ${feedTitle}`);
    
    return {
        items: newsItems,
        source: feedTitle,
        lastFetched: new Date().toISOString(),
        error: undefined
    };
}

// =====================================================
// PARSER ATOM CON REGEX
// =====================================================

function parseAtomWithRegex(xmlText: string): ParsedNewsData {
    // Extraer información del feed
    const feedMatch = xmlText.match(/<feed[^>]*>([\s\S]*?)<\/feed>/i);
    if (!feedMatch) {
        throw new Error('No feed element found');
    }
    
    const feedContent = feedMatch[1];
    
    // Extraer título del feed
    const titleMatch = feedContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const feedTitle = titleMatch ? cleanText(titleMatch[1]) : 'Unknown Feed';
    
    // Extraer subtítulo del feed
    const subtitleMatch = feedContent.match(/<subtitle[^>]*>([\s\S]*?)<\/subtitle>/i);
    const feedDescription = subtitleMatch ? cleanText(subtitleMatch[1]) : '';
    
    console.log(`📰 Parsing Atom feed: ${feedTitle}`);
    
    // Extraer entries
    const entryMatches = feedContent.match(/<entry[^>]*>([\s\S]*?)<\/entry>/gi);
    const newsItems: NewsItem[] = [];
    
    if (entryMatches) {
        entryMatches.forEach((entryContent, index) => {
            try {
                const newsItem = extractAtomEntryWithRegex(entryContent, feedTitle);
                if (newsItem) {
                    newsItems.push(newsItem);
                }
            } catch (error) {
                console.warn(`⚠️ Error parsing entry ${index}:`, error);
            }
        });
    }
    
    console.log(`✅ Parsed ${newsItems.length} entries from ${feedTitle}`);
    
    return {
        items: newsItems,
        source: feedTitle,
        lastFetched: new Date().toISOString(),
        error: undefined
    };
}

// =====================================================
// EXTRACCIÓN DE ITEM RSS CON REGEX
// =====================================================

function extractRSSItemWithRegex(itemContent: string, sourceName: string): NewsItem | null {
    // Extraer título
    const titleMatch = itemContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? cleanText(titleMatch[1]) : '';
    
    // Extraer descripción
    const descMatch = itemContent.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
    const description = descMatch ? cleanText(descMatch[1]) : '';
    
    // Extraer link
    const linkMatch = itemContent.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const link = linkMatch ? cleanText(linkMatch[1]) : '';
    
    // Extraer fecha de publicación
    const pubDateMatch = itemContent.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
    const pubDate = pubDateMatch ? cleanText(pubDateMatch[1]) : '';
    
    // Extraer GUID
    const guidMatch = itemContent.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
    const guid = guidMatch ? cleanText(guidMatch[1]) : '';
    
    if (!title || !link) {
        return null;
    }
    
    // Buscar imagen
    const image = extractImageFromItemWithRegex(itemContent);
    
    // Generar ID único
    const id = guid || `${sourceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
        id,
        title,
        description,
        link,
        pubDate: pubDate || new Date().toISOString(),
        source: sourceName,
        category: 'centrist', // Se determinará después
        image: image || undefined,
        guid: guid || undefined
    };
}

// =====================================================
// EXTRACCIÓN DE ENTRY ATOM CON REGEX
// =====================================================

function extractAtomEntryWithRegex(entryContent: string, sourceName: string): NewsItem | null {
    // Extraer título
    const titleMatch = entryContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? cleanText(titleMatch[1]) : '';
    
    // Extraer resumen/contenido
    const summaryMatch = entryContent.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
    const contentMatch = entryContent.match(/<content[^>]*>([\s\S]*?)<\/content>/i);
    const description = summaryMatch ? cleanText(summaryMatch[1]) : 
                       contentMatch ? cleanText(contentMatch[1]) : '';
    
    // Extraer link
    const linkMatch = entryContent.match(/<link[^>]*href="([^"]*)"[^>]*>/i);
    const link = linkMatch ? linkMatch[1] : '';
    
    // Extraer fecha de publicación
    const publishedMatch = entryContent.match(/<published[^>]*>([\s\S]*?)<\/published>/i);
    const updatedMatch = entryContent.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i);
    const pubDate = publishedMatch ? cleanText(publishedMatch[1]) : 
                   updatedMatch ? cleanText(updatedMatch[1]) : '';
    
    // Extraer ID
    const idMatch = entryContent.match(/<id[^>]*>([\s\S]*?)<\/id>/i);
    const guid = idMatch ? cleanText(idMatch[1]) : '';
    
    if (!title || !link) {
        return null;
    }
    
    // Buscar imagen
    const image = extractImageFromItemWithRegex(entryContent);
    
    // Generar ID único
    const id = guid || `${sourceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
        id,
        title,
        description,
        link,
        pubDate: pubDate || new Date().toISOString(),
        source: sourceName,
        category: 'centrist', // Se determinará después
        image: image || undefined,
        guid: guid || undefined
    };
}

// =====================================================
// EXTRACCIÓN DE IMAGEN CON REGEX
// =====================================================

function extractImageFromItemWithRegex(itemContent: string): string | null {
    // Buscar enclosure con imagen
    const enclosureMatch = itemContent.match(/<enclosure[^>]*type="[^"]*image[^"]*"[^>]*url="([^"]*)"[^>]*>/i);
    if (enclosureMatch) {
        return enclosureMatch[1];
    }
    
    // Buscar media:content
    const mediaContentMatch = itemContent.match(/<media:content[^>]*url="([^"]*)"[^>]*>/i);
    if (mediaContentMatch) {
        return mediaContentMatch[1];
    }
    
    // Buscar media:thumbnail
    const mediaThumbnailMatch = itemContent.match(/<media:thumbnail[^>]*url="([^"]*)"[^>]*>/i);
    if (mediaThumbnailMatch) {
        return mediaThumbnailMatch[1];
    }
    
    // Buscar en description (puede contener <img>)
    const imgMatch = itemContent.match(/<img[^>]+src="([^"]+)"/i);
    if (imgMatch) {
        return imgMatch[1];
    }
    
    return null;
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function cleanText(text: string): string {
    if (!text) return '';
    
    // Decodificar entidades HTML
    const htmlEntities: { [key: string]: string } = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&nbsp;': ' '
    };
    
    let cleaned = text;
    for (const [entity, char] of Object.entries(htmlEntities)) {
        cleaned = cleaned.replace(new RegExp(entity, 'g'), char);
    }
    
    // Remover tags HTML
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    // Limpiar espacios
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

function extractDomainName(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '').split('.')[0] || 'Unknown';
    } catch {
        return 'Unknown';
    }
}

function determineCategory(url: string): 'conservative' | 'centrist' | 'progressive' | 'regional' {
    const conservativeKeywords = ['abc', 'larazon', 'okdiario', 'eldebate', 'vozpopuli', 'libertaddigital', 'elindependiente', 'cope'];
    const progressiveKeywords = ['elpais', 'eldiario', 'infolibre', 'cadenaser', 'rtve', 'publico', 'nuevatribuna', 'ctxt'];
    const regionalKeywords = ['sevilla', 'madrid', 'cataluna', 'valencia', 'bilbao', 'galicia', 'andalucia'];
    
    const urlLower = url.toLowerCase();
    
    if (conservativeKeywords.some(keyword => urlLower.includes(keyword))) {
        return 'conservative';
    } else if (progressiveKeywords.some(keyword => urlLower.includes(keyword))) {
        return 'progressive';
    } else if (regionalKeywords.some(keyword => urlLower.includes(keyword))) {
        return 'regional';
    }
    
    return 'centrist';
}

function determineRegion(url: string): string | undefined {
    const regions = {
        'sevilla': 'andalucia',
        'cadiz': 'andalucia',
        'ideal': 'andalucia',
        'madridiario': 'madrid',
        'telemadrid': 'madrid',
        'lavanguardia': 'cataluna',
        'elperiodico': 'cataluna',
        'elcorreo': 'paisvasco',
        'deia': 'paisvasco',
        'levante': 'valencia',
        'lasprovincias': 'valencia'
    };
    
    const urlLower = url.toLowerCase();
    
    for (const [keyword, region] of Object.entries(regions)) {
        if (urlLower.includes(keyword)) {
            return region;
        }
    }
    
    return undefined;
}

// =====================================================
// FUNCIÓN PRINCIPAL DE PARSING
// =====================================================

export async function parseRSSFeed(source: NewsSource): Promise<ParsedNewsData> {
    try {
        // Verificar cache
        const cached = memoryCache.get(source.rssUrl);
        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            console.log(`📋 Using cached data for: ${source.name}`);
            return cached.data;
        }
        
        console.log(`🔄 Fetching RSS feed: ${source.name} (${source.rssUrl})`);
        
        // Fetch con proxies
        const xmlText = await fetchWithProxies(source.rssUrl);
        
        // Parsear XML con regex
        const parsedData = parseXMLWithRegex(xmlText);
        
        // Actualizar datos con información de la fuente
        parsedData.items.forEach(item => {
            item.source = source.name;
            item.category = source.category;
            if (source.region) {
                item.region = source.region;
            }
        });
        
        // Guardar en cache
        memoryCache.set(source.rssUrl, {
            data: parsedData,
            timestamp: Date.now()
        });
        
        // Guardar en base de datos
        await saveToDatabase(parsedData, source);
        
        return parsedData;
        
    } catch (error) {
        console.error(`❌ Error parsing RSS feed ${source.name}:`, error);
        
        // Fallback a datos de ejemplo
        return generateFallbackData(source);
    }
}

// =====================================================
// FUNCIÓN PARA GUARDAR EN BASE DE DATOS
// =====================================================

async function saveToDatabase(parsedData: ParsedNewsData, source: NewsSource): Promise<void> {
    try {
        const db = getDatabase();
        
        // Actualizar última fecha de fetch de la fuente
        db.prepare(`
            UPDATE news_sources 
            SET last_fetched = datetime('now'), updated_at = datetime('now')
            WHERE id = ?
        `).run(source.id);
        
        // Guardar cada noticia
        for (const item of parsedData.items) {
            try {
                db.prepare(`
                    INSERT OR REPLACE INTO news_items (
                        id, source_id, title, description, link, image_url,
                        pub_date, guid, category, region, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                `).run(
                    item.id,
                    source.id,
                    item.title,
                    item.description,
                    item.link,
                    item.image || null,
                    item.pubDate,
                    item.guid || null,
                    item.category,
                    item.region || null
                );
            } catch (itemError) {
                console.warn(`⚠️ Error saving item ${item.id}:`, itemError);
            }
        }
        
        // Registrar log de fetch exitoso
        db.prepare(`
            INSERT INTO fetch_logs (source_id, status, items_fetched, fetch_duration, created_at)
            VALUES (?, 'success', ?, ?, datetime('now'))
        `).run(source.id, parsedData.items.length, Date.now());
        
        console.log(`💾 Saved ${parsedData.items.length} items to database`);
        
    } catch (error) {
        console.error('❌ Error saving to database:', error);
    }
}

// =====================================================
// FUNCIÓN PARA PARSING MÚLTIPLE
// =====================================================

export async function parseMultipleFeeds(sources: NewsSource[]): Promise<ParsedNewsData[]> {
    console.log(`🔄 Parsing ${sources.length} RSS feeds...`);
    
    const results: ParsedNewsData[] = [];
    
    // Procesar en lotes para evitar sobrecarga
    const batchSize = 3;
    for (let i = 0; i < sources.length; i += batchSize) {
        const batch = sources.slice(i, i + batchSize);
        
        const batchPromises = batch.map(source => 
            parseRSSFeed(source).catch(error => ({
                items: [],
                source: source.name,
                lastFetched: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            }))
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Pausa entre lotes
        if (i + batchSize < sources.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log(`✅ Parsed ${results.length} feeds`);
    return results;
}

// =====================================================
// DATOS DE FALLBACK
// =====================================================

function generateFallbackData(source: NewsSource): ParsedNewsData {
    const timestamp = Date.now();
    
    const fallbackItems: NewsItem[] = [
        {
            id: `${source.id}-${timestamp}-1`,
            title: `Noticia destacada de ${source.name}`,
            description: `Esta es una noticia de ejemplo de ${source.name} para demostrar el funcionamiento de la aplicación.`,
            link: `https://example.com/${source.id}/news1`,
            pubDate: new Date().toISOString(),
            source: source.name,
            category: source.category,
            region: source.region,
            image: generatePlaceholderImage(source.name, source.category)
        },
        {
            id: `${source.id}-${timestamp}-2`,
            title: `Análisis político de ${source.name}`,
            description: `Análisis detallado de la situación política actual desde la perspectiva de ${source.name}.`,
            link: `https://example.com/${source.id}/news2`,
            pubDate: new Date(Date.now() - 3600000).toISOString(),
            source: source.name,
            category: source.category,
            region: source.region,
            image: generatePlaceholderImage(source.name, source.category)
        }
    ];
    
    return {
        items: fallbackItems,
        source: source.name,
        lastFetched: new Date().toISOString(),
        error: 'Using fallback data due to parsing error'
    };
}

function generatePlaceholderImage(sourceName: string, category: string): string {
    const colors = {
        conservative: 'crimson',
        centrist: 'cerulean',
        progressive: 'mint-green',
        regional: 'lapis-lazuli'
    };
    
    const color = colors[category] || 'gray';
    
    return `data:image/svg+xml;base64,${Buffer.from(`
        <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" fill="#f3f4f6"/>
            <text x="150" y="100" text-anchor="middle" font-family="Arial" font-size="16" fill="#374151">
                ${sourceName}
            </text>
            <text x="150" y="120" text-anchor="middle" font-family="Arial" font-size="12" fill="#6b7280">
                ${category.toUpperCase()}
            </text>
        </svg>
    `).toString('base64')}`;
}

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

export function clearCache(): void {
    memoryCache.clear();
    console.log('🧹 Cache cleared');
}

export function getCacheStats(): { size: number; keys: string[] } {
    return {
        size: memoryCache.size,
        keys: Array.from(memoryCache.keys())
    };
}

export async function testRSSUrl(url: string): Promise<{ success: boolean; error?: string; itemsCount?: number }> {
    try {
        console.log(`🧪 Testing RSS URL: ${url}`);
        
        const xmlText = await fetchWithProxies(url);
        
        // Contar items con regex
        const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi);
        const entryMatches = xmlText.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi);
        
        const itemsCount = (itemMatches?.length || 0) + (entryMatches?.length || 0);
        
        return { 
            success: true, 
            itemsCount 
        };
        
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function testMultipleRSSUrls(urls: string[]): Promise<Record<string, { success: boolean; error?: string; itemsCount?: number }>> {
    const results: Record<string, { success: boolean; error?: string; itemsCount?: number }> = {};
    
    console.log(`🧪 Testing ${urls.length} RSS URLs...`);
    
    for (const url of urls) {
        try {
            results[url] = await testRSSUrl(url);
            console.log(`${url}: ${results[url].success ? 'SUCCESS' : 'FAILED'} ${results[url].itemsCount ? `(${results[url].itemsCount} items)` : ''}`);
        } catch (error) {
            results[url] = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    
    return results;
}

// =====================================================
// FUNCIÓN PARA FETCH PROGRAMADO
// =====================================================

export async function scheduledFetch(): Promise<void> {
    try {
        console.log('🔄 Starting scheduled RSS fetch...');
        
        const db = getDatabase();
        const sources = db.prepare(`
            SELECT * FROM news_sources 
            WHERE is_active = 1 
            ORDER BY last_fetched ASC
        `).all();
        
        if (sources.length === 0) {
            console.log('📭 No active sources to fetch');
            return;
        }
        
        console.log(`📡 Fetching ${sources.length} sources...`);
        
        const results = await parseMultipleFeeds(sources);
        
        const totalItems = results.reduce((sum, result) => sum + result.items.length, 0);
        console.log(`✅ Scheduled fetch completed: ${totalItems} items from ${results.length} sources`);
        
    } catch (error) {
        console.error('❌ Error in scheduled fetch:', error);
    }
}
