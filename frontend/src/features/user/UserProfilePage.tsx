import { useEffect, useState } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import { BasePage } from '../../components/layout/BasePage'
import { apiUrl } from '@/config/api'

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
  const [tab, setTab] = useState<'data' | 'password'>('data')

  // Formulario de datos
  const [formName, setFormName] = useState('')
  const [formRegion, setFormRegion] = useState('')
  const [savingData, setSavingData] = useState(false)
  const [dataMessage, setDataMessage] = useState<string | null>(null)

  // Formulario de contraseña
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)

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
          setFormRegion(json.region || '')
        }
      } catch {
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  async function handleSaveData(e: React.FormEvent) {
    e.preventDefault()
    setDataMessage(null)
    setSavingData(true)
    try {
      const res = await fetch(apiUrl('/api/auth/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: formName, region: formRegion || null }),
      })
      const data = await res.json()
      if (res.ok) {
        setProfile(data)
        updateUser({ name: data.name, region: data.region || 'Sin región' })
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
        </nav>

        {tab === 'data' && (
          <form onSubmit={handleSaveData} className="app-profile-form">
            <div className="app-form-group">
              <label htmlFor="profile-email">Email</label>
              <input
                id="profile-email"
                type="email"
                value={profile.email}
                disabled
                className="app-input"
              />
              <span className="app-form-hint">
                El email no se puede cambiar.
              </span>
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
      </div>
    </BasePage>
  )
}
