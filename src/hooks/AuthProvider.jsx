import { useAuth } from './useAuth'
import { AuthContext } from './useAuthContext'

export function AuthProvider({ children }) {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
