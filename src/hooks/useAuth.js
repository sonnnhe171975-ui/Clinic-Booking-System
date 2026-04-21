import { useCallback, useMemo, useState } from 'react'
import { api } from '../api/client'
import { endpoints } from '../api/config'
import { clearStoredUser, getStoredUser, setStoredUser } from '../utils/auth'

export function useAuth() {
  const [user, setUser] = useState(getStoredUser())

  const login = useCallback(async (username, password) => {
    const safeUsername = String(username || '').trim().toLowerCase()
    const safePassword = String(password || '').trim()

    if (!safeUsername || !safePassword) {
      throw new Error('Vui lòng nhập đầy đủ tài khoản và mật khẩu')
    }

    let candidates = []
    try {
      candidates = await api.get(
        `${endpoints.users}?username=${encodeURIComponent(safeUsername)}`
      )
    } catch {
      throw new Error('Không kết nối được API. Vui lòng chạy npm run server')
    }

    const list = Array.isArray(candidates) ? candidates : []
    const found = list.find((item) => {
      const itemUsername = String(item.username || '').trim().toLowerCase()
      const itemPassword = String(item.password || '').trim()
      return itemUsername === safeUsername && itemPassword === safePassword
    })

    if (!found) {
      throw new Error('Sai tài khoản hoặc mật khẩu')
    }

    setStoredUser(found)
    setUser(found)
    return found
  }, [])

  const logout = useCallback(() => {
    clearStoredUser()
    setUser(null)
  }, [])

  return useMemo(() => {
    const role = user?.role || 'guest'
    return {
      user,
      role,
      isAdmin: role === 'admin',
      isPatient: role === 'patient',
      isDoctor: role === 'doctor',
      isGuest: !user,
      login,
      logout,
    }
  }, [user, login, logout])
}
