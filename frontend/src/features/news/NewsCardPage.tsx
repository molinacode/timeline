/**
 * Vista de una noticia tipo “card”: misma info que la card del timeline
 * más favicon de la fuente y footer con Guardar, Ver en lector, Compartir, Comentarios.
 */
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BasePage } from '../../components/layout/BasePage'
import { NewsImage } from '../../components/NewsImage'
import type { NewsItem } from '../../types/news'
import { apiUrl } from '@/config/api'
import { useAuth } from '../../app/providers/AuthProvider'

type LocationState = { item?: NewsItem }

function getFaviconFromLink(link: string | null | undefined): string | null {
  if (!link) return null
  try {
    const url = new URL(link)
    return `${url.origin}/favicon.ico`
  } catch {
    return null
  }
}

export function NewsCardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = useAuth()
  const state = (location.state || {}) as LocationState
  const stateItem = state.item

  const [item, setItem] = useState<NewsItem | null>(stateItem ?? null)
  const [saving, setSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [savedId, setSavedId] = useState<number | null>(null)

  const urlParam = new URLSearchParams(location.search).get('url')
  const [recoverLoading, setRecoverLoading] = useState(Boolean(urlParam && !stateItem))
  const [recoverError, setRecoverError] = useState<string | null>(null)

  useEffect(() => {
    if (stateItem) {
      setItem(stateItem)
      setRecoverLoading(false)
      return
    }
    if (!urlParam?.trim()) {
      setRecoverLoading(false)
      return
    }
    const controller = new AbortController()
    fetch(apiUrl(`/api/news/by-url?url=${encodeURIComponent(urlParam.trim())}`), {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Noticia no encontrada' : 'Error al cargar')
        return res.json()
      })
      .then((data) => {
        setItem({
          id: data.id,
          title: data.title,
          link: data.link,
          description: data.description ?? '',
          pubDate: data.pubDate ?? null,
          image: data.image ?? null,
          source: data.source ?? '',
          programName: data.programName ?? null,
        })
        setRecoverError(null)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setRecoverError(err.message || 'No se pudo cargar la noticia.')
        setItem(null)
      })
      .finally(() => setRecoverLoading(false))
    return () => controller.abort()
  }, [urlParam, stateItem])

  useEffect(() => {
    if (!token || !item?.id) return
    let cancelled = false
    fetch(apiUrl('/api/me/saved-news'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : [])
      .then((list: { savedId: number; id?: number; link?: string }[]) => {
        if (cancelled || !item.link) return
        const found = Array.isArray(list) && list.find((s) => s.link === item.link || s.id === item.id)
        if (found) {
          setIsSaved(true)
          if (found.savedId) setSavedId(found.savedId)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [token, item?.id, item?.link])

  async function handleSave() {
    if (!token || !item) return
    if (item.id == null) {
      const byUrl = await fetch(
        apiUrl(`/api/news/by-url?url=${encodeURIComponent(item.link)}`)
      ).then((r) => (r.ok ? r.json() : null))
      if (!byUrl?.id) return
      setItem((prev) => (prev ? { ...prev, id: byUrl.id } : null))
      await doSave(byUrl.id)
    } else {
      await doSave(item.id)
    }
  }

  async function doSave(newsId: number) {
    if (!token) return
    setSaving(true)
    try {
      const res = await fetch(apiUrl('/api/me/saved-news'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ news_id: newsId }),
      })
      const data = await res.json()
      if (res.ok && data.savedId) {
        setIsSaved(true)
        setSavedId(data.savedId)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleUnsave() {
    if (!token || savedId == null) return
    setSaving(true)
    try {
      const res = await fetch(apiUrl(`/api/me/saved-news/${savedId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setIsSaved(false)
        setSavedId(null)
      }
    } finally {
      setSaving(false)
    }
  }

  function handleOpenReader() {
    if (!item) return
    navigate(`/reader?url=${encodeURIComponent(item.link)}`, {
      state: { item, fromTab: 'Card' },
    })
  }

  function handleShare() {
    if (!item) return
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.description || item.title,
        url: item.link,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(item.link).then(() => {
        // eslint-disable-next-line no-alert
        alert('Enlace copiado')
      })
    }
  }

  const dateStr = item?.pubDate
    ? new Date(item.pubDate).toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''
  const faviconUrl = item ? getFaviconFromLink(item.link) : null
  const initial = item?.source?.charAt(0)?.toUpperCase() ?? '?'

  if (recoverLoading) {
    return (
      <BasePage>
        <div className="app-empty-state">
          <p className="app-empty-state-message">Cargando noticia…</p>
        </div>
      </BasePage>
    )
  }

  if (!item) {
    return (
      <BasePage>
        <div className="app-empty-state">
          <p className="app-empty-state-message">
            {recoverError || 'No se ha encontrado la noticia.'}
          </p>
          <button type="button" className="app-btn-primary" onClick={() => navigate(-1)}>
            Volver
          </button>
        </div>
      </BasePage>
    )
  }

  return (
    <BasePage>
      <div className="app-page-section app-news-card-page">
        <button
          type="button"
          className="app-header-back app-news-card-back"
          onClick={() => navigate(-1)}
        >
          ← Volver
        </button>

        <article className="app-card app-article-card app-news-card-article">
          <div className="app-article-card-media-wrap">
            <NewsImage src={item.image} />
          </div>
          <div className="app-article-card-body">
            <h1 className="app-page-title app-news-card-title">{item.title}</h1>
            {item.description && (
              <p className="app-page-subtitle app-page-subtitle--md app-page-subtitle--tight app-article-description-clamp">
                {item.description}
              </p>
            )}
            <div className="app-news-card-source-row">
              <span className="app-news-card-favicon" title={item.source}>
                {faviconUrl ? (
                  <img
                    src={faviconUrl}
                    alt=""
                    className="app-news-card-favicon-img"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="app-news-card-favicon-initial">{initial}</span>
                )}
              </span>
              <p className="app-comparador-cell-source app-timeline-meta">
                {item.source}
                {item.programName ? ` · ${item.programName}` : ''}
                {dateStr ? ` · ${dateStr}` : ''}
              </p>
            </div>
          </div>

          <footer className="app-news-card-footer">
            <button
              type="button"
              className="app-header-button"
              disabled={saving}
              onClick={isSaved ? handleUnsave : handleSave}
              aria-label={isSaved ? 'Quitar de guardadas' : 'Guardar noticia'}
            >
              {saving ? '…' : isSaved ? 'Guardada' : 'Guardar'}
            </button>
            <button
              type="button"
              className="app-header-button"
              onClick={handleOpenReader}
            >
              Ver en lector
            </button>
            <button
              type="button"
              className="app-header-button"
              onClick={handleShare}
            >
              Compartir
            </button>
            <button
              type="button"
              className="app-header-button"
              onClick={() => window.open(item.link, '_blank')}
              aria-label="Comentarios (abre la noticia)"
            >
              Comentarios
            </button>
          </footer>
        </article>
      </div>
    </BasePage>
  )
}
