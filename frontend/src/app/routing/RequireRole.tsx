import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export function RequireRole({
  role,
  children,
}: {
  role: 'user' | 'admin'
  children: JSX.Element
}) {
  const { user, hydrated } = useAuth()
  const location = useLocation()

  if (!hydrated) return null
  if (!user) return <Navigate to="/login" replace />
  if (!user.hasAcceptedTerms && location.pathname !== '/user-agreement') {
    return <Navigate to="/user-agreement" replace />
  }
  if (user.role !== role) return <Navigate to="/" replace />

  return children
}

