import { type ReactNode, useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { useDate } from '../../hooks/useDate'
import { useTheme } from '../../hooks/useTheme'
import { useGeolocationLabel } from '../../hooks/useGeolocationLabel'
import { useMenuSide } from '../../contexts/MenuSideContext'
import { NavLinkWithActive } from './NavLinkWithActive'

const DRAWER_BREAKPOINT = 900

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const date = useDate()
  const locationLabel = useGeolocationLabel()
  const { menuSide } = useMenuSide()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isNarrow, setIsNarrow] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= DRAWER_BREAKPOINT : false
  )

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth <= DRAWER_BREAKPOINT)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [drawerOpen])

  const showBackButton = location.pathname !== '/' && location.pathname !== ''

  const themeButton = (
    <button onClick={toggleTheme} className="app-header-button">
      {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    </button>
  )

  const closeDrawer = () => setDrawerOpen(false)

  const navContent = (
    <>
      {user?.role === 'admin' ? (
        <>
          <NavLinkWithActive to="/admin" onClick={closeDrawer}>Inicio</NavLinkWithActive>
          <NavLinkWithActive to="/admin/logs" onClick={closeDrawer}>Logs</NavLinkWithActive>
          <NavLinkWithActive to="/admin/users" onClick={closeDrawer}>Usuarios</NavLinkWithActive>
          {themeButton}
          <button onClick={() => { closeDrawer(); logout(); }} className="app-header-button">
            Cerrar sesión
          </button>
        </>
      ) : user ? (
        <>
          <NavLinkWithActive to="/me/timeline" onClick={closeDrawer}>Mi TimeLine</NavLinkWithActive>
          <NavLinkWithActive to="/me/comparator" onClick={closeDrawer}>Comparador</NavLinkWithActive>
          <NavLinkWithActive to="/me/saved" onClick={closeDrawer}>Guardadas</NavLinkWithActive>
          {themeButton}
          <Link
            to="/me/profile"
            onClick={closeDrawer}
            className="app-header-nav-link app-header-email-link"
            title="Ver mi perfil"
          >
            {user.email}
          </Link>
          <button onClick={() => { closeDrawer(); logout(); }} className="app-header-button">
            Cerrar sesión
          </button>
        </>
      ) : (
        <>
          <NavLinkWithActive to="/" end onClick={closeDrawer}>Inicio</NavLinkWithActive>
          <NavLinkWithActive to="/timeline" onClick={closeDrawer}>Mi TimeLine</NavLinkWithActive>
          <NavLinkWithActive to="/demo/clusters" onClick={closeDrawer}>Comparador</NavLinkWithActive>
          <NavLinkWithActive to="/demo/bias" onClick={closeDrawer}>Sesgo TimeLine</NavLinkWithActive>
          <NavLinkWithActive to="/sources" onClick={closeDrawer}>Fuentes</NavLinkWithActive>
          {themeButton}
          <NavLinkWithActive to="/login" onClick={closeDrawer}>Entrar</NavLinkWithActive>
        </>
      )}
    </>
  )

  const isComparatorPage = location.pathname === '/me/comparator'

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-left">
          {isNarrow && (
            <button
              type="button"
              className="app-header-hamburger"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menú"
            >
              <span className="app-header-hamburger-bar" />
              <span className="app-header-hamburger-bar" />
              <span className="app-header-hamburger-bar" />
            </button>
          )}
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
          {navContent}
          {user && (
            <button
              type="button"
              className="app-header-button app-header-search-button"
              onClick={() => navigate('/search')}
              title="Buscar noticias"
            >
              Buscar
            </button>
          )}
        </nav>
      </header>

      {isNarrow && user && (
        <nav className="app-mobile-tabs" aria-label="Secciones principales">
          <NavLinkWithActive to="/me/timeline" onClick={closeDrawer} end>
            Mi TimeLine
          </NavLinkWithActive>
          <NavLinkWithActive to="/me/comparator" onClick={closeDrawer}>
            Comparador
          </NavLinkWithActive>
          <NavLinkWithActive to="/me/saved" onClick={closeDrawer}>
            Guardadas
          </NavLinkWithActive>
        </nav>
      )}

      {/* Drawer móvil/tablet */}
      {drawerOpen && (
        <>
          <div
            className="app-drawer-overlay"
            onClick={closeDrawer}
            onKeyDown={(e) => e.key === 'Escape' && closeDrawer()}
            role="button"
            tabIndex={0}
            aria-label="Cerrar menú"
          />
          <aside
            className={`app-drawer app-drawer--${menuSide}`}
            aria-label="Menú de navegación"
            role="dialog"
            aria-modal="true"
          >
            <div className="app-drawer-header">
              <span className="app-drawer-title">Menú</span>
              <button
                type="button"
                className="app-drawer-close"
                onClick={closeDrawer}
                aria-label="Cerrar menú"
              >
                ×
              </button>
            </div>
            <nav className="app-drawer-nav">
              {navContent}
            </nav>
          </aside>
        </>
      )}

      <main className={isComparatorPage ? 'app-main app-main--wide' : 'app-main'}>
        {children}
      </main>
    </div>
  )
}
