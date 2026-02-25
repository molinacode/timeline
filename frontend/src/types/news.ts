/** Tipos compartidos para noticias y timeline */

export interface NewsItem {
  title: string
  link: string
  description: string
  pubDate?: string
  isoDate?: string
  image?: string | null
  source: string
  programName?: string | null
}

export interface BiasArticle {
  title: string
  link: string
  description?: string
  pubDate?: string
  image?: string | null
  source: string
  sourceBias?: string
}

export interface BiasGroup {
  progressive: BiasArticle | null
  centrist: BiasArticle | null
  conservative: BiasArticle | null
  otherSources?: BiasArticle[]
}

export interface ByBiasMatchedResponse {
  groups: BiasGroup[]
}
