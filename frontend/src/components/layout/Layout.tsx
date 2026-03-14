import type { ReactNode } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { useDate } from '../../hooks/useDate'
import { useTheme } from '../../hooks/useTheme'
import { useGeolocationLabel } from '../../hooks/useGeolocationLabel'
import { NavLinkWithActive } from './NavLinkWithActive'

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const date = useDate()
  const locationLabel = useGeolocationLabel()

  const showBackButton = location.pathname !== '/' && location.pathname !== ''

  const themeButton = (
    <button onClick={toggleTheme} className="app-header-button">
      {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    </button>
  )

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-left">
          <Link to="/" className="app-header-logo-link">
            <img
              src="/images/logo.svg"
              alt="TimeLine"
              className="app-header-logo"
            />
            <div>
              <div className="app-header-title">TimeLine</div>
              <div className="app-header-subtitle">El mundo a tu alrededor</div>
              <div className="app-header-meta" aria-label="Fecha y ubicación">
                {date.toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {locationLabel != null && (
                  <>
                    {' · '}
                    {locationLabel}
                  </>
                )}
              </div>
            </div>
          </Link>
        </div>
        {showBackButton && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="app-header-back"
            title="Volver atrás"
          >
            ← Atrás
          </button>
        )}
        <nav className="app-header-nav" aria-label="Navegación principal">
          {user?.role === 'admin' ? (
            <>
              <NavLinkWithActive to="/admin">Inicio</NavLinkWithActive>
              <NavLinkWithActive to="/admin/logs">Logs</NavLinkWithActive>
              <NavLinkWithActive to="/admin/users">Usuarios</NavLinkWithActive>
              {themeButton}
              <button onClick={logout} className="app-header-button">
                Cerrar sesión
              </button>
            </>
          ) : user ? (
            <>
              <NavLinkWithActive to="/me/timeline">Mi TimeLine</NavLinkWithActive>
              <NavLinkWithActive to="/me/comparator">Comparador</NavLinkWithActive>
              {themeButton}
              <Link
                to="/me/profile"
                className="app-header-nav-link app-header-email-link"
                title="Ver mi perfil"
              >
                {user.email}
              </Link>
              <button onClick={logout} className="app-header-button">
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <NavLinkWithActive to="/" end>Inicio</NavLinkWithActive>
              <NavLinkWithActive to="/timeline">Mi TimeLine</NavLinkWithActive>
              <NavLinkWithActive to="/demo/clusters">Comparador</NavLinkWithActive>
              <NavLinkWithActive to="/demo/bias">Sesgo TimeLine</NavLinkWithActive>
              <NavLinkWithActive to="/sources">Fuentes</NavLinkWithActive>
              {themeButton}
              <NavLinkWithActive to="/login">Entrar</NavLinkWithActive>
            </>
          )}
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}
