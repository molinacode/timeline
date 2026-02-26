import { Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, hydrated } = useAuth()

  // Mientras no sepamos si hay sesión (hidratando desde localStorage), no redirigimos.
  if (!hydrated) return null
  if (!user) return <Navigate to="/login" replace />

  return children
}
