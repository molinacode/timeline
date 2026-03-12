import { useCallback, useEffect, useState } from 'react'
import type { NewsItem } from '@/types/news'

const STORAGE_KEY = 'timeline:saved-articles'

function loadFromStorage(): NewsItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage(items: NewsItem[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignorar errores de almacenamiento
  }
}

export function useSavedArticles() {
  const [saved, setSaved] = useState<NewsItem[]>([])

  useEffect(() => {
    setSaved(loadFromStorage())
  }, [])

  const isSaved = useCallback(
    (item: NewsItem) => saved.some((n) => n.link === item.link),
    [saved]
  )

  const toggleSaved = useCallback((item: NewsItem) => {
    setSaved((prev) => {
      const exists = prev.some((n) => n.link === item.link)
      const next = exists
        ? prev.filter((n) => n.link !== item.link)
        : [...prev, item]
      saveToStorage(next)
      return next
    })
  }, [])

  return { saved, isSaved, toggleSaved }
}

