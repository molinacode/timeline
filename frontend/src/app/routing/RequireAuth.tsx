import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, hydrated } = useAuth()
  const location = useLocation()

  // Mientras no sepamos si hay sesión (hidratando desde localStorage), no redirigimos.
  if (!hydrated) return null
  if (!user) return <Navigate to="/login" replace />

  // Si el usuario aún no ha aceptado el acuerdo de uso, redirigimos a la página correspondiente.
  if (
    !user.hasAcceptedTerms &&
    location.pathname !== '/user-agreement'
  ) {
    return <Navigate to="/user-agreement" replace />
  }

  return children
}
