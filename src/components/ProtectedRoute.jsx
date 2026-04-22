import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'

function ProtectedRoute({ allow, children }) {
  const { user } = useAuthContext()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
