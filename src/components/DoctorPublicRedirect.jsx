import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'

/** Bác sĩ chỉ dùng /doctor — không vào landing/marketing. */
function DoctorPublicRedirect({ children }) {
  const { isDoctor } = useAuthContext()
  if (isDoctor) return <Navigate to="/doctor" replace />
  return children
}

export default DoctorPublicRedirect
