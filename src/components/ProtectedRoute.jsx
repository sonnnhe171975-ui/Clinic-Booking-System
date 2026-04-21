import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'

function ProtectedRoute({ allow, children }) {
  const { user } = useAuthContext()

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
