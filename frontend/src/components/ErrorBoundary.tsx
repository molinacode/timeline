import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Props = { children: ReactNode }
type State = { hasError: boolean; error: Error | null }

/**
 * Captura errores no manejados en la tree de componentes y muestra
 * una pantalla de fallback en lugar de una pantalla en blanco o el mensaje
 * genérico de error del navegador.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-page-section" style={{ maxWidth: '32rem', margin: '2rem auto', textAlign: 'center' }}>
          <h1 className="app-page-title">Algo ha ido mal</h1>
          <p className="app-page-subtitle">
            Ha ocurrido un error inesperado. Prueba a recargar la página o a volver al inicio.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="app-btn-primary"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Reintentar
            </button>
            <Link to="/" className="app-btn-secondary">
              Ir al inicio
            </Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
