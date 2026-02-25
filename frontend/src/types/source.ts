/** Tipos compartidos para fuentes RSS */

export interface Source {
  id: number
  name: string
  rssUrl: string
  websiteUrl?: string | null
  category?: string | null
  description?: string | null
  isActive: boolean
  lastError?: string | null
  lastFetchStatus?: string | null
}

export interface UserCustomSource {
  id: number
  name: string
  rssUrl: string
  category: string | null
  isActive: boolean
}
