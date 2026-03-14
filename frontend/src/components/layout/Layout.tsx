import { useState, useEffect, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { useDate } from '../../hooks/useDate'
import { useTheme } from '../../hooks/useTheme'
import { useGeolocationLabel } from '../../hooks/useGeolocationLabel'
import { NavLinkWithActive } from './NavLinkWithActive'

const BOTTOM_NAV_BREAKPOINT = 768

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const date = useDate()
  const locationLabel = useGeolocationLabel()

  const [menuOpen, setMenuOpen] = useState(false)
  const [showBottomNav, setShowBottomNav] = useState(
    typeof window !== 'undefined' ? window.innerWidth < BOTTOM_NAV_BREAKPOINT : false
  )

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BOTTOM_NAV_BREAKPOINT - 1}px)`)
    const handler = () => setShowBottomNav(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

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
              <NavLinkWithActive to="/search">Buscar</NavLinkWithActive>
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
      <main className={`app-main ${showBottomNav && user && user.role !== 'admin' ? 'app-main--with-bottom-nav' : ''}`}>
        {children}
      </main>
      {showBottomNav && user && user.role !== 'admin' && (
        <nav className="app-bottom-nav" aria-label="Navegación principal (móvil)">
          <NavLink
            to="/me/timeline"
            end
            className={({ isActive }) => `app-bottom-nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="app-bottom-nav-icon" aria-hidden>📰</span>
            <span>TimeLine</span>
          </NavLink>
          <NavLink
            to="/me/comparator"
            className={({ isActive }) => `app-bottom-nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="app-bottom-nav-icon" aria-hidden>⚖️</span>
            <span>Comparador</span>
          </NavLink>
          <NavLink
            to="/me/saved"
            className={({ isActive }) => `app-bottom-nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="app-bottom-nav-icon" aria-hidden>💾</span>
            <span>Guardadas</span>
          </NavLink>
          <NavLink
            to="/search"
            className={({ isActive }) => `app-bottom-nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="app-bottom-nav-icon" aria-hidden>🔍</span>
            <span>Buscar</span>
          </NavLink>
          <NavLink
            to="/me/profile"
            className={({ isActive }) => `app-bottom-nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="app-bottom-nav-icon" aria-hidden>👤</span>
            <span>Perfil</span>
          </NavLink>
        </nav>
      )}
    </div>
  )
}
