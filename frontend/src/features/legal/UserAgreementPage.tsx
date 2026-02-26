import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BasePage } from '../../components/layout/BasePage'
import { useAuth } from '../../app/providers/AuthProvider'
import { apiUrl } from '@/config/api'

export function UserAgreementPage() {
  const { token, user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token || !user) return
    if (!accepted) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(apiUrl('/api/auth/accept-terms'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(
          data.message || 'No se pudo guardar tu aceptación. Inténtalo de nuevo.'
        )
        return
      }

      updateUser({ hasAcceptedTerms: true })
      navigate('/me/timeline', { replace: true })
    } catch {
      setError('Error de conexión. Revisa tu red e inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <BasePage
      title="Acuerdo de uso de TimeLine"
      subtitle="Antes de empezar a usar tu cuenta, revisa y acepta estas normas básicas."
    >
      <section className="app-page-section app-legal-section">
        <div className="app-card app-card--spaced app-legal-card">
          <h2 className="app-legal-heading">Qué no está permitido</h2>
          <ul className="app-legal-list">
            <li>
              Añadir fuentes RSS con contenido <strong>ilegal</strong> o que
              incumpla la legislación española o de la Unión Europea.
            </li>
            <li>
              Fuentes con <strong>desnudos o contenido sexualmente explícito</strong>.
            </li>
            <li>
              Contenido que haga <strong>apología de la violencia</strong>, del
              terrorismo o de actividades delictivas.
            </li>
            <li>
              Discurso de <strong>odio</strong>, racismo, xenofobia o{' '}
              <strong>LGTBIfobia</strong>.
            </li>
            <li>
              Fuentes que inciten al <strong>acoso</strong>, amenazas o ataques
              personales.
            </li>
          </ul>

          <h2 className="app-legal-heading">Responsabilidad del usuario</h2>
          <p className="app-legal-text">
            TimeLine es un agregador que reúne titulares de múltiples medios a
            través de RSS. Aunque aplicamos filtros automáticos para bloquear
            fuentes inadecuadas, tú eres responsable de las fuentes
            personalizadas que añadas a tu cuenta.
          </p>
          <p className="app-legal-text">
            Si detectamos que una cuenta añade o comparte fuentes que incumplen
            estas normas, podremos <strong>bloquear o suspender</strong> el
            acceso para proteger al resto de usuarios.
          </p>

          <h2 className="app-legal-heading">Tratamiento de tus datos</h2>
          <p className="app-legal-text">
            Usamos tus datos básicos (email, nombre, región y preferencias) para
            ofrecerte un timeline personalizado y mejorar el servicio. No
            vendemos tus datos a terceros.
          </p>

          <form onSubmit={handleSubmit} className="app-legal-form">
            <label className="app-legal-checkbox">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span>
                He leído y acepto el acuerdo de uso de TimeLine y me comprometo
                a no añadir ni compartir fuentes RSS con contenido ilegal,
                sexualmente explícito, violento u ofensivo (odio, racismo,
                LGTBIfobia, etc.).
              </span>
            </label>

            {error && (
              <p className="app-form-message app-form-message--error">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="app-btn-primary"
              disabled={!accepted || loading}
            >
              {loading ? 'Guardando…' : 'Aceptar y continuar'}
            </button>
          </form>
        </div>
      </section>
    </BasePage>
  )
}

