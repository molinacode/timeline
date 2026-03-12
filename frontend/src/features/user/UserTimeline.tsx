import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { useRegionFromGeolocation } from '../../hooks/useRegionFromGeolocation'
import { useNewsClickTracker } from '../../hooks/useNewsClickTracker'
import { useSavedArticles } from '../../hooks/useSavedArticles'
import regionsData from '../../data/demoSourcesByRegion.json'
import { BasePage } from '../../components/layout/BasePage'
import { TimelineArticleCard } from '../../components/TimelineArticleCard'
import { apiUrl } from '@/config/api'
import type { NewsItem } from '../../types/news'
import type { Category } from '../../types/category'
import type { UserCustomSource } from '../../types/source'

type TabId = 'ultima-hora' | 'locales' | 'mis-rss' | `category:${string}`

const STATIC_TABS: { id: TabId; label: string }[] = [
  { id: 'ultima-hora', label: 'Última hora' },
  { id: 'locales', label: 'Fuentes locales' },
  { id: 'mis-rss', label: 'Mis fuentes RSS' },
]

export function UserTimeline() {
  const { token } = useAuth()
  const { trackClick } = useNewsClickTracker()
  const { isSaved, toggleSaved } = useSavedArticles()
  const navigate = useNavigate()
  const {
    regionId,
    loading: geoLoading,
  } = useRegionFromGeolocation()

  const [lastHourItems, setLastHourItems] = useState<NewsItem[]>([])
  const [lastHourOffset, setLastHourOffset] = useState(0)
  const [lastHourHasMore, setLastHourHasMore] = useState(true)
  const LAST_HOUR_PAGE_SIZE = 15
  const [categories, setCategories] = useState<Category[]>([])
  const [userSources, setUserSources] = useState<UserCustomSource[]>([])
  const [loadingLastHour, setLoadingLastHour] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingUserSources, setLoadingUserSources] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categoryNews, setCategoryNews] = useState<NewsItem[]>([])
  const [loadingCategoryNews, setLoadingCategoryNews] = useState(false)
  const [categoryOffset, setCategoryOffset] = useState(0)
  const [categoryHasMore, setCategoryHasMore] = useState(true)
  const CATEGORY_PAGE_SIZE = 15
  const [localNews, setLocalNews] = useState<NewsItem[]>([])
  const [loadingLocalNews, setLoadingLocalNews] = useState(false)
  const [manualRegionId, setManualRegionId] = useState<string | null>(null)

  // Formulario agregar RSS
  const [newName, setNewName] = useState('')
  const [newRssUrl, setNewRssUrl] = useState('')
  const [addingSource, setAddingSource] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('ultima-hora')

  const effectiveRegionId = regionId || null
  const activeLocalRegionId = manualRegionId || effectiveRegionId
  const region =
    regionsData.regions.find((r) => r.id === activeLocalRegionId) ?? null
  const hasGeoRegion = !!regionId
  const isDefaultMadrid = !hasGeoRegion && !manualRegionId

  // Carga inicial de Última hora (scroll infinito con /api/news)
  useEffect(() => {
    loadMoreLastHour()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadMoreLastHour() {
    if (loadingLastHour || !lastHourHasMore) return
    try {
      setLoadingLastHour(true)
      const res = await fetch(
        apiUrl(
          `/api/news?limit=${LAST_HOUR_PAGE_SIZE}&offset=${lastHourOffset}`
        )
      )
      const text = await res.text()
      let data: NewsItem[] = []
      try {
        data = text ? JSON.parse(text) : []
      } catch {
        console.error('Respuesta no válida de /api/news')
      }
      if (!Array.isArray(data)) data = []
      setLastHourItems((prev) => [...prev, ...data])
      setLastHourOffset((prev) => prev + data.length)
      if (data.length < LAST_HOUR_PAGE_SIZE || lastHourOffset + data.length >= 100) {
        setLastHourHasMore(false)
      }
    } catch (e) {
      console.error('Error cargando noticias', e)
      setLastHourHasMore(false)
    } finally {
      setLoadingLastHour(false)
    }
  }

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
    if (!activeLocalRegionId) {
      setLocalNews([])
      return
    }
    const region = activeLocalRegionId
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
    setCategoryNews([])
    setCategoryOffset(0)
    setCategoryHasMore(true)
    await loadMoreCategory(cat, 0)
  }

  async function loadMoreCategory(cat: string, offsetOverride?: number) {
    const offsetToUse = offsetOverride ?? categoryOffset
    if (loadingCategoryNews || !categoryHasMore) return
    setLoadingCategoryNews(true)
    try {
      const res = await fetch(
        apiUrl(
          `/api/news/by-category?category=${encodeURIComponent(
            cat
          )}&limit=${CATEGORY_PAGE_SIZE}&offset=${offsetToUse}`
        )
      )
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : []
        setCategoryNews((prev) => [...prev, ...list])
        setCategoryOffset(offsetToUse + list.length)
        if (list.length < CATEGORY_PAGE_SIZE || offsetToUse + list.length >= 100) {
          setCategoryHasMore(false)
        }
      } else {
        setCategoryHasMore(false)
      }
    } catch {
      setCategoryHasMore(false)
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

  const categoryTabs: { id: TabId; label: string }[] = categories.map((c) => ({
    id: `category:${c.name}`,
    label: c.name,
  }))

  const allTabs: { id: TabId; label: string }[] = [
    STATIC_TABS[0], // Última hora
    ...categoryTabs,
    STATIC_TABS[1], // Locales
    STATIC_TABS[2], // Mis RSS
  ]

  const isCategoryView = activeTab.startsWith('category:')

  return (
    <BasePage title="Mi TimeLine">
      <div className="app-page-section">
        <nav className="app-timeline-tabs" role="tablist">
          {allTabs.map((tab) => {
            const isSelected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                {...(isSelected && { 'aria-selected': 'true' })}
                aria-controls={
                  tab.id === 'locales'
                    ? 'panel-locales'
                    : tab.id === 'mis-rss'
                    ? 'panel-mis-rss'
                    : 'panel-ultima-hora'
                }
                id={`tab-${tab.id}`}
                className={`app-timeline-tab ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id)
                  if (tab.id.startsWith('category:')) {
                    const name = tab.id.slice('category:'.length)
                    loadNewsByCategory(name)
                  }
                }}
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
            hidden={activeTab !== 'ultima-hora' && !isCategoryView}
            className="app-timeline-panel"
          >
            <h2 className="app-card-title">
              {isCategoryView ? selectedCategory || 'Noticias por categoría' : 'Última hora'}
            </h2>
            {isCategoryView ? (
              loadingCategoryNews && categoryNews.length === 0 ? (
                <p className="app-muted-inline">Cargando noticias…</p>
              ) : categoryNews.length === 0 ? (
                <p className="app-muted-inline">No hay noticias para esta categoría.</p>
              ) : (
                <>
                <div className="app-flex-col app-grid-responsive">
                  {categoryNews.map((item, idx) => (
                    <TimelineArticleCard
                      key={`${item.link}-${idx}`}
                      item={item}
                      formatDate
                      isSaved={isSaved(item)}
                      onLinkClick={(source, link) =>
                        trackClick(source, link || item.link)
                      }
                      onSaveClick={() => toggleSaved(item)}
                      onReaderClick={() =>
                        navigate(
                          `/me/reader?url=${encodeURIComponent(item.link)}`
                        )
                      }
                      onShareClick={async () => {
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
                          // usuario canceló o fallo silencioso
                        }
                      }}
                    />
                  ))}
                </div>
                  {categoryHasMore && selectedCategory && (
                    <div className="app-load-more">
                      <button
                        type="button"
                        className="app-button app-btn-secondary"
                        disabled={loadingCategoryNews}
                        onClick={() => loadMoreCategory(selectedCategory)}
                      >
                        {loadingCategoryNews ? 'Cargando…' : 'Cargar más'}
                      </button>
                    </div>
                  )}
                </>
              )
            ) : loadingLastHour ? (
              <p className="app-muted-inline">Cargando…</p>
            ) : lastHourItems.length === 0 ? (
              <p className="app-muted-inline">No hay noticias disponibles.</p>
            ) : (
              <>
                <div className="app-flex-col app-grid-responsive">
                  {lastHourItems.map((item, idx) => (
                    <TimelineArticleCard
                      key={`${item.link}-${idx}`}
                      item={item}
                      formatDate
                      isSaved={isSaved(item)}
                      onLinkClick={(source, link) =>
                        trackClick(source, link || item.link)
                      }
                      onSaveClick={() => toggleSaved(item)}
                      onReaderClick={() =>
                        navigate(
                          `/me/reader?url=${encodeURIComponent(item.link)}`
                        )
                      }
                      onShareClick={async () => {
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
                          // usuario canceló o fallo silencioso
                        }
                      }}
                    />
                  ))}
                </div>
                {lastHourHasMore && (
                  <div className="app-load-more">
                    <button
                      type="button"
                      className="app-button app-btn-secondary"
                      disabled={loadingLastHour}
                      onClick={loadMoreLastHour}
                    >
                      {loadingLastHour ? 'Cargando…' : 'Cargar más'}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* 2. Local / Regional */}
          <section
            id="panel-locales"
            role="tabpanel"
            aria-labelledby="tab-locales"
            hidden={activeTab !== 'locales'}
            className="app-timeline-panel"
          >
            <h2 className="app-card-title">Noticias locales</h2>
            <p className="app-card-subtitle app-page-subtitle--tight">
              {activeLocalRegionId
                ? `Noticias de ${region?.name || 'tu región'}.`
                : 'Elige una región o activa tu ubicación para ver noticias locales.'}
            </p>
            <div className="app-local-regions-chips">
              {regionsData.regions.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`app-category-chip ${
                    activeLocalRegionId === r.id ? 'active' : ''
                  }`}
                  onClick={() => setManualRegionId(r.id)}
                  title={r.name}
                >
                  {r.name}
                </button>
              ))}
            </div>
            {geoLoading && !activeLocalRegionId ? (
              <p className="app-muted-inline">Detectando ubicación…</p>
            ) : !activeLocalRegionId ? (
              <p className="app-muted-inline">
                Aún no has elegido una comunidad autónoma. Selecciona una región
                de la lista superior o activa la geolocalización de tu navegador.
              </p>
            ) : loadingLocalNews ? (
              <p className="app-muted-inline">Cargando noticias…</p>
            ) : localNews.length === 0 ? (
              <p className="app-muted-inline">
                No hay noticias disponibles para {region?.name || 'esta región'}.
              </p>
            ) : (
              <div className="app-flex-col app-grid-responsive">
                {localNews.map((item, idx) => (
                  <TimelineArticleCard
                    key={`${item.link}-${idx}`}
                    item={item}
                    formatDate
                    isSaved={isSaved(item)}
                    onLinkClick={(source, link) =>
                      trackClick(source, link || item.link)
                    }
                    onSaveClick={() => toggleSaved(item)}
                    onReaderClick={() =>
                      navigate(
                        `/me/reader?url=${encodeURIComponent(item.link)}`
                      )
                    }
                    onShareClick={async () => {
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
                        // usuario canceló o fallo silencioso
                      }
                    }}
                  />
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
