import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { BasePage } from '../../../components/layout/BasePage'
import { NewsImage } from '../../../components/NewsImage'
import type { NewsItem } from '../../../types/news'
import { apiUrl } from '@/config/api'

type LocationState = {
  item?: NewsItem
  fromTab?: string
}

export function ReaderPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const urlParam = searchParams.get('url')
  const state = (location.state || {}) as LocationState
  const stateItem = state.item
  const fromTab = state.fromTab

  const [item, setItem] = useState<NewsItem | null>(stateItem ?? null)
  const [recoverLoading, setRecoverLoading] = useState(Boolean(urlParam && !stateItem))
  const [recoverError, setRecoverError] = useState<string | null>(null)
  const [mode, setMode] = useState<'reader' | 'web'>('reader')
  const [enrichedHtml, setEnrichedHtml] = useState<string | null>(null)
  const [enrichedLoading, setEnrichedLoading] = useState(false)
  const [enrichedError, setEnrichedError] = useState<string | null>(null)

  // Recuperar noticia por URL al recargar (cuando no hay state)
  useEffect(() => {
    if (stateItem) {
      setItem(stateItem)
      setRecoverLoading(false)
      setRecoverError(null)
      return
    }
    if (!urlParam || urlParam.trim() === '') {
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
        if (err.name === 'AbortError') return
        setRecoverError(err.message || 'No se pudo cargar la noticia.')
        setItem(null)
      })
      .finally(() => setRecoverLoading(false))
    return () => controller.abort()
  }, [urlParam, stateItem])

  if (recoverLoading) {
    return (
      <BasePage centered title="Lector de noticias">
        <div className="app-empty-state">
          <p className="app-empty-state-message">Cargando noticia…</p>
        </div>
      </BasePage>
    )
  }

  if (!item) {
    return (
      <BasePage centered title="Lector de noticias">
        <div className="app-empty-state">
          <p className="app-empty-state-message">
            {recoverError || 'No se ha encontrado la noticia.'} Vuelve al timeline y ábrela de nuevo.
          </p>
          <button type="button" className="app-btn-primary" onClick={() => navigate('/me/timeline')}>
            Ir a Mi TimeLine
          </button>
        </div>
      </BasePage>
    )
  }

  const domain = (() => {
    try {
      const url = new URL(item.link)
      return url.hostname.replace(/^www\./, '')
    } catch {
      return ''
    }
  })()

  useEffect(() => {
    if (!item?.link) return
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      controller.abort()
    }, 5000)

    setEnrichedLoading(true)
    setEnrichedError(null)

    fetch(apiUrl(`/api/reader?url=${encodeURIComponent(item.link)}`), {
      headers: {},
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.contentHtml === 'string' && data.contentHtml) {
          setEnrichedHtml(data.contentHtml)
        } else {
          setEnrichedHtml(null)
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          setEnrichedError('El modo lector tardó demasiado en responder.')
        } else {
          setEnrichedError('No se pudo cargar el modo lector enriquecido.')
        }
        setEnrichedHtml(null)
      })
      .finally(() => {
        clearTimeout(timeoutId)
        setEnrichedLoading(false)
      })

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [item?.link])

  const timeAgo = (() => {
    if (!item.pubDate) return ''
    const date = new Date(item.pubDate)
    if (Number.isNaN(date.getTime())) return ''
    const diffMs = Date.now() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Hace un momento'
    if (diffMin < 60) return `Hace ${diffMin} min`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `Hace ${diffH} h`
    const diffD = Math.floor(diffH / 24)
    return `Hace ${diffD} días`
  })()

  return (
    <BasePage
      title="Lector de noticias"
      subtitle="Lee la noticia en formato limpio o abre la versión original."
      className="app-reader-page"
    >
      <div className="app-page-section app-reader-header">
        <button
          type="button"
          className="app-header-back"
          onClick={() => navigate(-1)}
        >
          ← Volver
        </button>
        <div className="app-reader-toggle">
          <button
            type="button"
            className={mode === 'reader' ? 'active' : ''}
            onClick={() => setMode('reader')}
          >
            Lector
          </button>
          <button
            type="button"
            className={mode === 'web' ? 'active' : ''}
            onClick={() => window.open(item.link, '_blank')}
          >
            Web original
          </button>
        </div>
      </div>

      {mode === 'reader' ? (
        <div className="app-page-section app-reader-content">
          <article className="app-card app-reader-article">
            <NewsImage src={item.image} />
            <div className="app-reader-body">
              {fromTab && (
                <p className="app-page-label app-page-label--normal">
                  {fromTab.toUpperCase()}
                </p>
              )}
              <h1 className="app-page-title">{item.title}</h1>
              <p className="app-reader-meta">
                {item.source}
                {domain ? ` · ${domain}` : ''}
                {timeAgo ? ` · ${timeAgo}` : ''}
              </p>
              {enrichedLoading && (
                <p className="app-reader-text">Cargando versión para lector…</p>
              )}
              {!enrichedLoading && enrichedHtml && (
                <div
                  className="app-reader-text"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: enrichedHtml }}
                />
              )}
              {!enrichedLoading && !enrichedHtml && item.description && (
                <p className="app-reader-text">{item.description}</p>
              )}
              {!enrichedLoading && !enrichedHtml && !item.description && (
                <p className="app-reader-text">
                  No se ha podido extraer el contenido completo de esta noticia. Puedes
                  abrirla en la web original.
                </p>
              )}
              <div className="app-reader-meta app-reader-meta--external">
                <button
                  type="button"
                  className="app-header-button"
                  onClick={() => window.open(item.link, '_blank')}
                >
                  Ver en web original
                </button>
                <button
                  type="button"
                  className="app-header-button"
                  onClick={async () => {
                    try {
                      if (navigator.share) {
                        await navigator.share({
                          title: item.title,
                          text: item.description || item.title,
                          url: item.link,
                        })
                      } else {
                        await navigator.clipboard.writeText(item.link)
                        // eslint-disable-next-line no-alert
                        alert('Enlace copiado al portapapeles')
                      }
                    } catch {
                      // usuario canceló o error silencioso
                    }
                  }}
                >
                  Compartir
                </button>
              </div>
            </div>
          </article>
        </div>
      ) : (
        <div className="app-page-section app-reader-web">
          <p className="app-reader-text">
            Esta opción abrirá la noticia en su sitio de origen en una pestaña
            nueva del navegador.
          </p>
          <button
            type="button"
            className="app-btn-primary"
            onClick={() => window.open(item.link, '_blank')}
          >
            Ir a la web original {domain ? `(${domain})` : ''}
          </button>
        </div>
      )}
    </BasePage>
  )
}


