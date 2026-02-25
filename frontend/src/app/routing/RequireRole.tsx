import { Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

export function RequireRole({
  role,
  children
}: {
  role: 'user' | 'admin';
  children: JSX.Element;
}) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;

  return children;
}

