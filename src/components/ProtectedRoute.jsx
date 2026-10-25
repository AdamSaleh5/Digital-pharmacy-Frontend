import { Navigate, useLocation } from 'react-router-dom'
import { canAccessPath, getCurrentRole, isAgent } from '../utils/permissions'

export default function ProtectedRoute({ children, allowRoles }) {
  const location = useLocation()
  const token = sessionStorage.getItem('token')
  const role = getCurrentRole()

  if (!token) return <Navigate to="/login" replace />
  if (isAgent() && location.pathname === '/') return <Navigate to="/medications" replace />
  if (!canAccessPath(location.pathname)) return <Navigate to={isAgent() ? '/medications' : '/'} replace />
  if (allowRoles && !allowRoles.includes(role)) return <Navigate to={isAgent() ? '/medications' : '/'} replace />
  return children
}
