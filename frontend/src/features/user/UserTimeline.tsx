import { useEffect, useState } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import { useRegionFromGeolocation } from '../../hooks/useRegionFromGeolocation'
import { useNewsClickTracker } from '../../hooks/useNewsClickTracker'
import regionsData from '../../data/demoSourcesByRegion.json'
import { BasePage } from '../../components/layout/BasePage'
import { apiUrl } from '@/config/api'
import type { NewsItem } from '../../types/news'
import type { Category } from '../../types/category'
import type { UserCustomSource } from '../../types/source'

type TabId = 'ultima-hora' | 'categorias' | 'locales' | 'mis-rss'

const TABS: { id: TabId; label: string }[] = [
  { id: 'ultima-hora', label: 'Última hora' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'locales', label: 'Fuentes locales' },
  { id: 'mis-rss', label: 'Mis fuentes RSS' },
]

export function UserTimeline() {
  const { token } = useAuth()
  const { trackClick } = useNewsClickTracker()
  const {
    regionId,
    loading: geoLoading,
  } = useRegionFromGeolocation()

  const [lastHourItems, setLastHourItems] = useState<NewsItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [userSources, setUserSources] = useState<UserCustomSource[]>([])
  const [loadingLastHour, setLoadingLastHour] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingUserSources, setLoadingUserSources] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categoryNews, setCategoryNews] = useState<NewsItem[]>([])
  const [loadingCategoryNews, setLoadingCategoryNews] = useState(false)
  const [localNews, setLocalNews] = useState<NewsItem[]>([])
  const [loadingLocalNews, setLoadingLocalNews] = useState(false)

  // Formulario agregar RSS
  const [newName, setNewName] = useState('')
  const [newRssUrl, setNewRssUrl] = useState('')
  const [addingSource, setAddingSource] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('ultima-hora')

  const effectiveRegionId = regionId || 'madrid'
  const region = regionsData.regions.find((r) => r.id === effectiveRegionId) ?? null
  const isDefaultMadrid = !regionId && effectiveRegionId === 'madrid'

  useEffect(() => {
    ;(async () => {
      try {
        setLoadingLastHour(true)
        const res = await fetch(apiUrl('/api/news/ultima-hora?limit=15'))
        const text = await res.text()
        let data: NewsItem[] = []
        try {
          data = text ? JSON.parse(text) : []
        } catch {
          console.error('Respuesta no válida de /api/news/ultima-hora')
        }
        if (!Array.isArray(data)) data = []
        setLastHourItems(data)
      } catch (e) {
        console.error('Error cargando noticias', e)
        setLastHourItems([])
      } finally {
        setLoadingLastHour(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!token) return
    ;(async () => {
      try {
        setLoadingCategories(true)
        const res = await fetch(apiUrl('/api/categories'), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setCategories(Array.isArray(data) ? data : [])
        }
      } catch {
        setCategories([])
      } finally {
        setLoadingCategories(false)
      }
    })()
  }, [token])

  useEffect(() => {
    if (!token) return
    loadUserSources()
  }, [token])

  useEffect(() => {
    if (activeTab !== 'locales') return
    const region = effectiveRegionId || 'madrid'
    setLoadingLocalNews(true)
    fetch(apiUrl(`/api/news/by-region?region=${encodeURIComponent(region)}&limit=30`))
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLocalNews(Array.isArray(data) ? data : []))
      .catch(() => setLocalNews([]))
      .finally(() => setLoadingLocalNews(false))
  }, [activeTab, effectiveRegionId])

  async function loadUserSources() {
    if (!token) return
    try {
      setLoadingUserSources(true)
      const res = await fetch(apiUrl('/api/me/sources'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUserSources(Array.isArray(data) ? data : [])
      }
    } catch {
      setUserSources([])
    } finally {
      setLoadingUserSources(false)
    }
  }

  async function handleAddSource(e: React.FormEvent) {
    e.preventDefault()
    setAddError(null)
    if (!newName.trim() || !newRssUrl.trim()) {
      setAddError('Nombre y URL RSS son obligatorios')
      return
    }
    setAddingSource(true)
    try {
      const res = await fetch(apiUrl('/api/me/sources'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName.trim(),
          rssUrl: newRssUrl.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setNewName('')
        setNewRssUrl('')
        await loadUserSources()
      } else {
        setAddError(data.message || 'Error al agregar la fuente')
      }
    } catch {
      setAddError('Error de conexión')
    } finally {
      setAddingSource(false)
    }
  }

  async function loadNewsByCategory(cat: string) {
    setSelectedCategory(cat)
    setLoadingCategoryNews(true)
    try {
      const res = await fetch(
        apiUrl(`/api/news/by-category?category=${encodeURIComponent(cat)}&limit=20`)
      )
      if (res.ok) {
        const data = await res.json()
        setCategoryNews(Array.isArray(data) ? data : [])
      } else {
        setCategoryNews([])
      }
    } catch {
      setCategoryNews([])
    } finally {
      setLoadingCategoryNews(false)
    }
  }

  async function handleRemoveSource(id: number) {
    if (!token) return
    try {
      const res = await fetch(apiUrl(`/api/me/sources/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) await loadUserSources()
    } catch {
      console.error('Error eliminando fuente')
    }
  }

  return (
    <BasePage
      title="Mi TimeLine"
      subtitle="Tus fuentes, categorías y últimas noticias."
    >
      <div className="app-page-section">
        <nav className="app-timeline-tabs" role="tablist">
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                {...(isSelected && { 'aria-selected': 'true' })}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                className={`app-timeline-tab ${isSelected ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="app-timeline-panels">
          {/* 1. Última hora */}
          <section
            id="panel-ultima-hora"
            role="tabpanel"
            aria-labelledby="tab-ultima-hora"
            hidden={activeTab !== 'ultima-hora'}
            className="app-timeline-panel"
          >
            <h2 className="app-card-title">Última hora</h2>
            {loadingLastHour ? (
              <p className="app-muted-inline">Cargando…</p>
            ) : lastHourItems.length === 0 ? (
              <p className="app-muted-inline">No hay noticias disponibles.</p>
            ) : (
              <div className="app-flex-col">
                {lastHourItems.map((item, idx) => (
                  <article key={idx} className="app-card app-article-card">
                    {item.image && (
                      <img
                        src={item.image}
                        alt=""
                        className="user-timeline-img app-article-card-media"
                      />
                    )}
                    <div className="app-article-card-body">
                      <h2 className="app-page-title app-headline-link">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="app-link-inherit"
                          onClick={() => trackClick(item.source, item.link)}
                        >
                          {item.title}
                        </a>
                      </h2>
                      <p className="app-page-subtitle app-page-subtitle--md app-page-subtitle--tight app-article-description-clamp">
                        {item.description}
                      </p>
                      <p className="app-comparador-cell-source app-timeline-meta">
                        {item.source}
                        {item.programName
                          ? ` · ${item.programName}`
                          : ''} · {item.pubDate}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* 2. Categorías */}
          <section
            id="panel-categorias"
            role="tabpanel"
            aria-labelledby="tab-categorias"
            hidden={activeTab !== 'categorias'}
            className="app-timeline-panel"
          >
            <h2 className="app-card-title">Categorías</h2>
            <p className="app-card-subtitle app-page-subtitle--tight">
              Noticias de las fuentes por categoría temática.
            </p>
            {categories.length === 0 ? (
              <p className="app-muted-inline">
                No hay categorías configuradas. El administrador puede crearlas en el panel de Admin.
              </p>
            ) : (
            <div className="app-categories-chips">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`app-category-chip ${selectedCategory === c.name ? 'active' : ''}`}
                  onClick={() => loadNewsByCategory(c.name)}
                  title={c.description || undefined}
                >
                  {c.name}
                </button>
              ))}
            </div>
            )}
            {selectedCategory && (
              <>
                <h3 className="app-card-title app-category-news-title">
                  {selectedCategory}
                </h3>
                {loadingCategoryNews ? (
                  <p className="app-muted-inline">Cargando noticias…</p>
                ) : categoryNews.length === 0 ? (
                  <p className="app-muted-inline">
                    No hay noticias en esta categoría por ahora.
                  </p>
                ) : (
                  <div className="app-flex-col">
                    {categoryNews.map((item, idx) => (
                      <article key={idx} className="app-card app-article-card">
                        {item.image && (
                          <img
                            src={item.image}
                            alt=""
                            className="user-timeline-img app-article-card-media"
                          />
                        )}
                        <div className="app-article-card-body">
                          <h2 className="app-page-title app-headline-link">
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noreferrer"
                              className="app-link-inherit"
                              onClick={() => trackClick(item.source, item.link)}
                            >
                              {item.title}
                            </a>
                          </h2>
                          {item.description && (
                            <p className="app-page-subtitle app-page-subtitle--md app-page-subtitle--tight app-article-description-clamp">
                              {item.description}
                            </p>
                          )}
                          <p className="app-comparador-cell-source app-timeline-meta">
                            {item.source}
                            {item.pubDate ? ` · ${item.pubDate}` : ''}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          {/* 3. Local / Regional */}
          <section
            id="panel-locales"
            role="tabpanel"
            aria-labelledby="tab-locales"
            hidden={activeTab !== 'locales'}
            className="app-timeline-panel"
          >
            <h2 className="app-card-title">Noticias locales</h2>
            <p className="app-card-subtitle app-page-subtitle--tight">
              {isDefaultMadrid
                ? 'Madrid por defecto (activa la geolocalización para ver noticias de tu región).'
                : `Noticias de ${region?.name || 'tu región'}.`}
            </p>
            {geoLoading ? (
              <p className="app-muted-inline">Detectando ubicación…</p>
            ) : loadingLocalNews ? (
              <p className="app-muted-inline">Cargando noticias…</p>
            ) : localNews.length === 0 ? (
              <p className="app-muted-inline">
                No hay noticias disponibles para {region?.name || 'esta región'}.
              </p>
            ) : (
              <div className="app-flex-col">
                {localNews.map((item, idx) => (
                  <article key={idx} className="app-card app-article-card">
                    {item.image && (
                      <img
                        src={item.image}
                        alt=""
                        className="user-timeline-img app-article-card-media"
                      />
                    )}
                    <div className="app-article-card-body">
                      <h2 className="app-page-title app-headline-link">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="app-link-inherit"
                          onClick={() => trackClick(item.source, item.link)}
                        >
                          {item.title}
                        </a>
                      </h2>
                      {item.description && (
                        <p className="app-page-subtitle app-page-subtitle--md app-page-subtitle--tight app-article-description-clamp">
                          {item.description}
                        </p>
                      )}
                      <p className="app-comparador-cell-source app-timeline-meta">
                        {item.source}
                        {item.pubDate
                          ? ` · ${new Date(item.pubDate).toLocaleString('es-ES', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}`
                          : ''}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* 4. Agregar fuentes RSS */}
          <section
            id="panel-mis-rss"
            role="tabpanel"
            aria-labelledby="tab-mis-rss"
            hidden={activeTab !== 'mis-rss'}
            className="app-timeline-panel"
          >
            <h2 className="app-card-title">Mis fuentes RSS</h2>
            <p className="app-card-subtitle app-page-subtitle--tight">
              Agrega tus propias fuentes RSS para seguir sus noticias.
            </p>

            <form onSubmit={handleAddSource} className="app-add-source-form">
              <div className="app-form-row">
                <input
                  type="text"
                  placeholder="Nombre de la fuente"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="app-input"
                />
                <input
                  type="url"
                  placeholder="URL del feed RSS"
                  value={newRssUrl}
                  onChange={(e) => setNewRssUrl(e.target.value)}
                  className="app-input"
                />
                <button
                  type="submit"
                  className="app-button app-btn-primary"
                  disabled={addingSource}
                >
                  {addingSource ? 'Agregando…' : 'Agregar'}
                </button>
              </div>
              {addError && (
                <p className="app-form-message app-form-message--error">
                  {addError}
                </p>
              )}
            </form>

            {loadingUserSources ? (
              <p className="app-muted-inline">Cargando tus fuentes…</p>
            ) : userSources.length === 0 ? (
              <p className="app-muted-inline">
                No has agregado ninguna fuente RSS todavía.
              </p>
            ) : (
              <ul className="app-sources-list">
                {userSources.map((s) => (
                  <li
                    key={s.id}
                    className="app-sources-list-item app-sources-list-item--with-action"
                  >
                    <a
                      href={s.rssUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="app-link-accent"
                    >
                      {s.name}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveSource(s.id)}
                      className="app-button app-button--sm app-button--danger"
                      title="Eliminar"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </BasePage>
  )
}
