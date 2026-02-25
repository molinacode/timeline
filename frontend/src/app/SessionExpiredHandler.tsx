import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './providers/AuthProvider'

/**
 * Escucha el evento 'session-expired' (p. ej. cuando fetch recibe 401 con token)
 * y cierra sesión y redirige a /login.
 */
export function SessionExpiredHandler() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handler = () => {
      logout()
      navigate('/login', { replace: true })
    }
    window.addEventListener('session-expired', handler)
    return () => window.removeEventListener('session-expired', handler)
  }, [logout, navigate])

  return null
}
