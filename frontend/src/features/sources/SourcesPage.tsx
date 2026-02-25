import { useAuth } from '../../app/providers/AuthProvider'
import { useRegionFromGeolocation } from '../../hooks/useRegionFromGeolocation'
import fuentesBase from '../../data/fuentes-base.json'
import regionsData from '../../data/demoSourcesByRegion.json'
import { BasePage } from '../../components/layout/BasePage'
import { useEffect, useState } from 'react'

type BaseSource = (typeof fuentesBase.sources)[number]
export function SourcesPage() {
  const { user } = useAuth()
  const {
    regionId,
    locationLabel,
    loading: geoLoading,
    error: geoError,
  } = useRegionFromGeolocation()
  const [geoPermissionDenied, setGeoPermissionDenied] = useState(false)

  // Si hay error y no hay navigator.geolocation, el usuario no ha concedido permiso
  useEffect(() => {
    if (geoError && !geoLoading) {
      setGeoPermissionDenied(true)
    }
  }, [geoError, geoLoading])

  const region = regionId
    ? regionsData.regions.find((r) => r.id === regionId)
    : null

  return (
    <BasePage
      title="Fuentes de noticias"
      subtitle="Fuentes nacionales y, si inicias sesión con geolocalización activada, fuentes de tu región."
    >
      <div className="app-page-section">
        {/* Fuentes base: siempre visibles */}
        <section className="app-sources-section">
          <h2 className="app-card-title">Fuentes nacionales</h2>
          <p className="app-card-subtitle app-page-subtitle--tight">
            Medios de ámbito nacional disponibles para todos.
          </p>
          <ul className="app-sources-list">
            {fuentesBase.sources.map((s) => (
              <SourceItem key={s.id} source={s} isBase />
            ))}
          </ul>
        </section>

        {/* Fuentes regionales: solo logueado + geolocalización */}
        <section className="app-sources-section">
          <h2 className="app-card-title">Fuentes regionales</h2>
          {!user ? (
            <p className="app-card-subtitle app-page-subtitle--tight">
              Inicia sesión para ver las fuentes de tu región.
            </p>
          ) : geoLoading ? (
            <p className="app-card-subtitle app-page-subtitle--tight">
              Detectando tu ubicación…
            </p>
          ) : geoError || geoPermissionDenied ? (
            <p className="app-card-subtitle app-page-subtitle--tight">
              Para ver fuentes regionales, activa la geolocalización en tu
              navegador y recarga la página.
            </p>
          ) : regionId && region ? (
            <>
              <p className="app-card-subtitle app-page-subtitle--tight">
                {locationLabel && <>Ubicación detectada: {locationLabel}</>}
                {region.sources.length === 0 ? (
                  <> No hay fuentes cargadas para {region.name}.</>
                ) : (
                  <> Fuentes de {region.name}:</>
                )}
              </p>
              {region.sources.length > 0 ? (
                <ul className="app-sources-list">
                  {region.sources.map((s) => (
                    <SourceItem
                      key={s.id}
                      source={{
                        id: s.id,
                        name: s.name,
                        url: s.url,
                        description: s.city ? `(${s.city})` : undefined,
                      }}
                      isBase={false}
                    />
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <p className="app-card-subtitle app-page-subtitle--tight">
              No se pudo detectar tu región. Verifica que la geolocalización
              esté activada.
            </p>
          )}
        </section>
      </div>
    </BasePage>
  )
}

function SourceItem({
  source,
  isBase,
}: {
  source:
    | BaseSource
    | { id: string; name: string; url: string; description?: string }
  isBase: boolean
}) {
  const rssUrl = 'rssUrl' in source ? source.rssUrl : undefined
  return (
    <li className="app-sources-list-item">
      <a
        href={source.url}
        target="_blank"
        rel="noreferrer"
        className="app-link-accent"
      >
        {source.name}
      </a>
      {source.description && (
        <span className="app-muted-inline"> {source.description}</span>
      )}
      {isBase && rssUrl && <span className="app-muted-inline"> · RSS</span>}
    </li>
  )
}
