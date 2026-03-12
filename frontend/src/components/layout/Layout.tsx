import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { useDate } from '../../hooks/useDate'
import { useTheme } from '../../hooks/useTheme'
import { useGeolocationLabel } from '../../hooks/useGeolocationLabel'
import { NavLinkWithActive } from './NavLinkWithActive'

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const date = useDate()
  const locationLabel = useGeolocationLabel()

  const [menuOpen, setMenuOpen] = useState(false)

  const themeButton = (
    <button onClick={toggleTheme} className="app-header-icon-button" title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
      {theme === 'dark' ? '☀️' : '🌙'}
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
        <button
          type="button"
          className="app-header-icon-button app-header-menu-toggle"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          ☰
        </button>
        <nav
          className={`app-header-nav ${menuOpen ? 'app-header-nav--open' : ''}`}
          aria-label="Navegación principal"
        >
          {user?.role === 'admin' ? (
            <>
              <NavLinkWithActive to="/admin">Inicio</NavLinkWithActive>
              <NavLinkWithActive to="/admin/logs">Logs</NavLinkWithActive>
              <NavLinkWithActive to="/admin/users">Usuarios</NavLinkWithActive>
              {themeButton}
              <button onClick={logout} className="app-header-icon-button" title="Cerrar sesión">
                ⏻
              </button>
            </>
          ) : user ? (
            <>
              <NavLinkWithActive to="/me/timeline">Mi TimeLine</NavLinkWithActive>
              <NavLinkWithActive to="/me/comparator">Comparador</NavLinkWithActive>
              <NavLinkWithActive to="/me/saved">Guardadas</NavLinkWithActive>
              {themeButton}
              <Link
                to="/me/profile"
                className="app-header-avatar-link"
                title="Ver mi perfil"
              >
                <span className="app-header-avatar-circle">
                  {(user.name && user.name.trim()[0]) ||
                    (user.email && user.email.trim()[0]) ||
                    '?'}
                </span>
              </Link>
              <button onClick={logout} className="app-header-icon-button" title="Cerrar sesión">
                ⏻
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
      {menuOpen && (
        <div
          className="app-header-overlay"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <main className="app-main">{children}</main>
    </div>
  )
}
