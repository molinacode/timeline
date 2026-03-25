import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { BasePage } from '../../components/layout/BasePage'
import { apiUrl } from '@/config/api'

const SOURCES_PREFS_KEY = 'timeline_sources_prefs_v1'

type SourcesPrefs = {
  lastHourEnabled: string[]
  localEnabledByRegion: Record<string, string[]>
}

type ProfileData = {
  id: number
  email: string
  name: string
  region: string | null
  role: string
  created_at: string
  last_login: string | null
}

export function UserProfilePage() {
  const { token, updateUser } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'data' | 'password' | 'sources'>('data')

  // Formulario de datos
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRegion, setFormRegion] = useState('')
  const [savingData, setSavingData] = useState(false)
  const [dataMessage, setDataMessage] = useState<string | null>(null)

  // Formulario de contraseña
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)

  // Ajustes de fuentes (UX): persistencia en localStorage (sin backend todavía)
  const [sourcesPrefs, setSourcesPrefs] = useState<SourcesPrefs>({
    lastHourEnabled: [],
    localEnabledByRegion: {},
  })
  const [sourcesDraft, setSourcesDraft] = useState<SourcesPrefs>({
    lastHourEnabled: [],
    localEnabledByRegion: {},
  })
  const [sourcesSavedMsg, setSourcesSavedMsg] = useState<string | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(SOURCES_PREFS_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as SourcesPrefs
      if (
        parsed &&
        Array.isArray(parsed.lastHourEnabled) &&
        typeof parsed.localEnabledByRegion === 'object'
      ) {
        setSourcesPrefs(parsed)
        setSourcesDraft(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  const lastHourAll = useMemo(() => {
    // Lista base curada (se puede refinar luego con catálogo real)
    return ['El País', 'El Mundo', 'ABC', 'La Razón', 'Eldiario.es', '20Minutos.es', 'El Confidencial']
  }, [])

  const effectiveLastHourEnabled =
    sourcesDraft.lastHourEnabled.length > 0 ? sourcesDraft.lastHourEnabled : lastHourAll

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(apiUrl('/api/auth/profile'), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const json = await res.json()
          setProfile(json)
          setFormName(json.name)
          setFormEmail(json.email || '')
          setFormRegion(json.region || '')
        }
      } catch {
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  const canEditEmail = profile?.email?.endsWith('@bluesky.local') ?? false
  const needsProfileCompletion =
    !!profile &&
    (profile.email?.endsWith('@bluesky.local') || !profile.name?.trim())

  async function handleSaveData(e: React.FormEvent) {
    e.preventDefault()
    setDataMessage(null)
    setSavingData(true)
    try {
      const body: { name: string; region: string | null; email?: string } = {
        name: formName,
        region: formRegion || null,
      }
      if (canEditEmail && formEmail.trim()) body.email = formEmail.trim()
      const res = await fetch(apiUrl('/api/auth/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setProfile(data)
        updateUser({
          name: data.name,
          region: data.region || 'Sin región',
          email: data.email,
        })
        setDataMessage('Datos actualizados correctamente.')
      } else {
        setDataMessage(data.message || 'Error al guardar')
      }
    } catch {
      setDataMessage('Error de conexión')
    } finally {
      setSavingData(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordMessage(null)
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Las contraseñas no coinciden.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordMessage('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setSavingPassword(true)
    try {
      const res = await fetch(apiUrl('/api/auth/password'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setPasswordMessage('Contraseña actualizada correctamente.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordMessage(data.message || 'Error al cambiar contraseña')
      }
    } catch {
      setPasswordMessage('Error de conexión')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <BasePage title="Mi perfil" subtitle="Datos de tu cuenta">
        <p>Cargando perfil…</p>
      </BasePage>
    )
  }

  if (!profile) {
    return (
      <BasePage title="Mi perfil" subtitle="Datos de tu cuenta">
        <p>No se pudo cargar el perfil.</p>
      </BasePage>
    )
  }

  return (
    <BasePage title="Mi perfil" subtitle="Datos de tu cuenta y configuración">
      <div className="app-page-section">
        {needsProfileCompletion && (
          <div className="app-profile-incomplete" role="status">
            <p className="app-profile-incomplete-title">Completa tu perfil</p>
            <p className="app-profile-incomplete-text">
              Añade tu nombre y un email de contacto para tu cuenta TimeLine.
            </p>
          </div>
        )}

        <nav className="app-nav-pills">
          <button
            type="button"
            className={tab === 'data' ? 'active' : ''}
            onClick={() => setTab('data')}
          >
            Datos de usuario
          </button>
          <button
            type="button"
            className={tab === 'password' ? 'active' : ''}
            onClick={() => setTab('password')}
          >
            Cambiar contraseña
          </button>
          <button
            type="button"
            className={tab === 'sources' ? 'active' : ''}
            onClick={() => setTab('sources')}
          >
            Fuentes
          </button>
          <Link
            to="/me/interests"
            className="app-nav-pills-link"
          >
            Ajustar intereses
          </Link>
        </nav>

        {tab === 'data' && (
          <form onSubmit={handleSaveData} className="app-profile-form">
            <div className="app-form-group">
              <label htmlFor="profile-email">Email</label>
              <input
                id="profile-email"
                type="email"
                value={canEditEmail ? formEmail : profile.email}
                onChange={canEditEmail ? (e) => setFormEmail(e.target.value) : undefined}
                disabled={!canEditEmail}
                className="app-input"
              />
              {canEditEmail ? (
                <span className="app-form-hint">
                  Puedes indicar un correo para tu cuenta TimeLine.
                </span>
              ) : (
                <span className="app-form-hint">
                  El email no se puede cambiar.
                </span>
              )}
            </div>
            <div className="app-form-group">
              <label htmlFor="profile-name">Nombre</label>
              <input
                id="profile-name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="app-input"
                required
              />
            </div>
            <div className="app-form-group">
              <label htmlFor="profile-region">Región</label>
              <input
                id="profile-region"
                type="text"
                value={formRegion}
                onChange={(e) => setFormRegion(e.target.value)}
                className="app-input"
                placeholder="Ej: España"
              />
            </div>
            <p className="app-profile-readonly">
              Registrado:{' '}
              {new Date(profile.created_at).toLocaleDateString('es-ES')}
              {profile.last_login && (
                <>
                  {' '}
                  · Último acceso:{' '}
                  {new Date(profile.last_login).toLocaleString('es-ES')}
                </>
              )}
            </p>
            {dataMessage && (
              <p
                className={`app-form-message ${
                  dataMessage.includes('correctamente')
                    ? 'app-form-message--success'
                    : 'app-form-message--error'
                }`}
              >
                {dataMessage}
              </p>
            )}
            <button type="submit" className="app-button" disabled={savingData}>
              {savingData ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={handleChangePassword} className="app-profile-form">
            <div className="app-form-group">
              <label htmlFor="profile-current-password">
                Contraseña actual
              </label>
              <input
                id="profile-current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="app-input"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="app-form-group">
              <label htmlFor="profile-new-password">Nueva contraseña</label>
              <input
                id="profile-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="app-input"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="app-form-group">
              <label htmlFor="profile-confirm-password">
                Confirmar nueva contraseña
              </label>
              <input
                id="profile-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="app-input"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            {passwordMessage && (
              <p
                className={`app-form-message ${
                  passwordMessage.includes('correctamente')
                    ? 'app-form-message--success'
                    : 'app-form-message--error'
                }`}
              >
                {passwordMessage}
              </p>
            )}
            <button
              type="submit"
              className="app-button"
              disabled={savingPassword}
            >
              {savingPassword ? 'Cambiando…' : 'Cambiar contraseña'}
            </button>
          </form>
        )}

        {tab === 'sources' && (
          <div className="app-profile-form app-profile-sources">
            <div className="app-card-header app-card-header--sm">
              <h3 className="app-card-title app-card-title--xs">Fuentes del feed</h3>
              <p className="app-muted-inline">
                Elige qué fuentes entran en Última hora y en Locales. El comparador es fijo.
              </p>
            </div>

            <div className="app-form-group">
              <label className="auth-label-inline">Última hora</label>
              <div className="app-source-toggles">
                {lastHourAll.map((name) => {
                  const enabled = effectiveLastHourEnabled.includes(name)
                  return (
                    <label key={name} className="app-source-toggle">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => {
                          setSourcesSavedMsg(null)
                          setSourcesDraft((prev) => {
                            const base =
                              prev.lastHourEnabled.length > 0
                                ? prev.lastHourEnabled
                                : lastHourAll
                            const next = e.target.checked
                              ? [...new Set([...base, name])]
                              : base.filter((x) => x !== name)
                            return { ...prev, lastHourEnabled: next }
                          })
                        }}
                      />
                      <span>{name}</span>
                    </label>
                  )
                })}
              </div>
              <div className="app-flex-row">
                <button
                  type="button"
                  className="app-button app-button--sm"
                  onClick={() => {
                    setSourcesSavedMsg(null)
                    setSourcesDraft((p) => ({ ...p, lastHourEnabled: lastHourAll }))
                  }}
                >
                  Seleccionar todas
                </button>
                <button
                  type="button"
                  className="app-button app-button--sm"
                  onClick={() => {
                    setSourcesSavedMsg(null)
                    setSourcesDraft((p) => ({ ...p, lastHourEnabled: [] }))
                  }}
                >
                  Restablecer (todas)
                </button>
              </div>
              <span className="app-form-hint">
                Si no seleccionas nada, se mostrarán todas las fuentes.
              </span>
            </div>

            <div className="app-form-group">
              <label className="auth-label-inline">Locales</label>
              <span className="app-form-hint">
                (Siguiente paso) Aquí mostraremos las fuentes locales de tu región para activar/desactivar.
              </span>
            </div>

            {sourcesSavedMsg && (
              <p className="app-form-message app-form-message--success">{sourcesSavedMsg}</p>
            )}

            <div className="app-flex-row">
              <button
                type="button"
                className="app-button app-btn-primary"
                onClick={() => {
                  setSourcesPrefs(sourcesDraft)
                  localStorage.setItem(SOURCES_PREFS_KEY, JSON.stringify(sourcesDraft))
                  setSourcesSavedMsg('Preferencias guardadas.')
                }}
              >
                Guardar fuentes
              </button>
              <button
                type="button"
                className="app-button"
                onClick={() => {
                  setSourcesDraft(sourcesPrefs)
                  setSourcesSavedMsg('Cambios descartados.')
                }}
              >
                Descartar
              </button>
            </div>
          </div>
        )}
      </div>
    </BasePage>
  )
}
