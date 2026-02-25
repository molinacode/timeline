import { FormEvent, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { BasePage } from '../../components/layout/BasePage'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <BasePage
      centered
      title="Iniciar sesión"
      subtitle="Introduce tus credenciales para acceder a tu TimeLine personalizado."
    >
      <div className="app-card app-card--form auth-container">
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
      </div>
    </BasePage>
  )
}
