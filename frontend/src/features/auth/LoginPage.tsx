import { FormEvent, useRef, useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { BasePage } from '../../components/layout/BasePage'

export function LoginPage() {
  const { user, login, loginWithBluesky, hydrated } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [blueskyIdentifier, setBlueskyIdentifier] = useState('')
  const [blueskyAppPassword, setBlueskyAppPassword] = useState('')
  const [blueskyLoading, setBlueskyLoading] = useState(false)
  const [blueskyError, setBlueskyError] = useState<string | null>(null)
  const [loginMode, setLoginMode] = useState<'email' | 'bluesky'>('email')
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const loggedUser = await login(email, password)
      navigate(loggedUser.role === 'admin' ? '/admin' : '/me/timeline')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  async function handleBlueskySubmit(e: FormEvent) {
    e.preventDefault()
    setBlueskyLoading(true)
    setBlueskyError(null)
    try {
      const loggedUser = await loginWithBluesky(blueskyIdentifier.trim(), blueskyAppPassword)
      navigate(loggedUser.role === 'admin' ? '/admin' : '/me/timeline')
    } catch (err: any) {
      setBlueskyError(err.message || 'Error al iniciar sesión con Bluesky')
    } finally {
      setBlueskyLoading(false)
    }
  }

  // Si ya hay sesión cargada, redirigir fuera del formulario de login.
  if (hydrated && user) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/admin' : '/me/timeline'}
        replace
      />
    )
  }

  return (
    <BasePage
      centered
      title="Iniciar sesión"
      subtitle="Introduce tus credenciales para acceder a tu TimeLine personalizado."
    >
      <div
        className="app-card app-card--form auth-container"
        onTouchStart={(e) => {
          const t = e.touches[0]
          if (!t) return
          touchStartX.current = t.clientX
          touchStartY.current = t.clientY
        }}
        onTouchEnd={(e) => {
          const startX = touchStartX.current
          const startY = touchStartY.current
          touchStartX.current = null
          touchStartY.current = null
          if (startX == null || startY == null) return

          const t = e.changedTouches[0]
          if (!t) return

          const dx = t.clientX - startX
          const dy = t.clientY - startY

          // Swipe horizontal suave para cambiar entre modos.
          if (Math.abs(dx) < 48) return
          if (Math.abs(dy) > 40) return

          if (dx < 0) setLoginMode('bluesky')
          else setLoginMode('email')
        }}
      >
        <div className="auth-tabs" role="tablist" aria-label="Tipo de inicio de sesión">
          <button
            type="button"
            role="tab"
            aria-selected={loginMode === 'email'}
            className={`auth-tab ${loginMode === 'email' ? 'auth-tab--active' : ''}`}
            onClick={() => setLoginMode('email')}
          >
            Correo y contraseña
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={loginMode === 'bluesky'}
            className={`auth-tab ${loginMode === 'bluesky' ? 'auth-tab--active' : ''}`}
            onClick={() => setLoginMode('bluesky')}
          >
            Bluesky / AT Protocol
          </button>
        </div>

        {loginMode === 'email' && (
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-label">
              Correo electrónico
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="app-input"
              />
            </label>
            <label className="auth-label">
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="app-input"
              />
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" disabled={loading} className="app-btn-primary">
              {loading ? 'Entrando…' : 'Entrar'}
            </button>

            <p className="auth-link">
              ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
            </p>
          </form>
        )}

        {loginMode === 'bluesky' && (
          <div className="auth-provider-block">
            <p className="auth-provider-caption">Proveedor de alojamiento Bluesky Social</p>
            <form onSubmit={handleBlueskySubmit} className="auth-form">
            <label className="auth-label">
              Handle o correo Bluesky
              <input
                type="text"
                value={blueskyIdentifier}
                onChange={(e) => setBlueskyIdentifier(e.target.value)}
                placeholder="usuario.bsky.social"
                required
                className="app-input"
                autoComplete="username"
              />
            </label>
            <label className="auth-label">
              Contraseña de Bluesky
              <input
                type="password"
                value={blueskyAppPassword}
                onChange={(e) => setBlueskyAppPassword(e.target.value)}
                placeholder="xxxx-xxxx-xxxx-xxxx"
                required
                className="app-input"
                autoComplete="current-password"
              />
            </label>
            <p className="auth-provider-app-password">
              <a
                href="https://bsky.social/settings/app-passwords"
                target="_blank"
                rel="noopener noreferrer"
                className="app-link"
              >
                Crear contraseña de aplicación en Bluesky
              </a>
            </p>
            {blueskyError && <p className="auth-error">{blueskyError}</p>}
            <button
              type="submit"
              disabled={blueskyLoading}
              className="app-btn-primary"
            >
              {blueskyLoading ? 'Entrando…' : 'Entrar con Bluesky'}
            </button>
          </form>
          </div>
        )}
      </div>
    </BasePage>
  )
}
