import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BasePage } from '@/components/layout/BasePage'
import { NewsImage } from '@/components/NewsImage'
import { apiUrl } from '@/config/api'

interface ReaderArticle {
  title?: string
  contentHtml?: string
  content?: string
  text?: string
  image?: string
  source?: string
  site?: string
  pubDate?: string
  url?: string
}

export function ReaderPage() {
  const [searchParams] = useSearchParams()
  const articleUrl = searchParams.get('url') || ''

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [article, setArticle] = useState<ReaderArticle | null>(null)

  useEffect(() => {
    if (!articleUrl) return
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        setArticle(null)
        const res = await fetch(
          apiUrl(`/api/reader?url=${encodeURIComponent(articleUrl)}`)
        )
        if (!res.ok) {
          throw new Error('No se pudo cargar el artículo')
        }
        const data = await res.json().catch(() => null)
        setArticle(data || {})
      } catch (e) {
        console.error(e)
        setError('No se pudo cargar el contenido del lector.')
      } finally {
        setLoading(false)
      }
    })()
  }, [articleUrl])

  if (!articleUrl) {
    return (
      <BasePage title="Lector">
        <div className="app-page-section">
          <p className="app-muted-inline">
            Falta la URL del artículo. Vuelve a tu timeline y abre el lector
            desde una tarjeta.
          </p>
        </div>
      </BasePage>
    )
  }

  const title = article?.title || 'Artículo'
  const source = article?.source || article?.site || ''
  const pubDateStr = article?.pubDate
    ? new Date(article.pubDate).toLocaleString('es-ES', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : ''

  const html =
    article?.contentHtml ||
    (article?.content && article.content.includes('<')
      ? article.content
      : '') ||
    ''

  const textFallback =
    !html && (article?.text || article?.content || '').toString()

  return (
    <BasePage title={title}>
      <div className="app-page-section">
        <article className="app-card app-article-card">
          {article?.image && <NewsImage src={article.image} />}
          <div className="app-article-card-body">
            <h1 className="app-page-title">{title}</h1>
            <p className="app-timeline-meta">
              {source && <span>{source}</span>}
              {pubDateStr && (
                <>
                  {source ? ' · ' : ''}
                  <span>{pubDateStr}</span>
                </>
              )}
            </p>
            <p className="app-muted-inline app-page-subtitle--tight">
              Contenido obtenido automáticamente desde la página original.
            </p>
            {html ? (
              <div
                className="app-reader-content"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : textFallback ? (
              <p className="app-page-subtitle app-page-subtitle--tight">
                {textFallback}
              </p>
            ) : loading ? (
              <p className="app-muted-inline">Cargando contenido…</p>
            ) : error ? (
              <p className="app-form-message app-form-message--error">
                {error}
              </p>
            ) : (
              <p className="app-muted-inline">
                No se ha podido extraer contenido legible de esta página.
              </p>
            )}
          </div>
        </article>
      </div>
    </BasePage>
  )
}

