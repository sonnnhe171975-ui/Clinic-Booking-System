import { useMemo, useState } from 'react'
import { api } from '../api/client'
import { endpoints } from '../api/config'
import { clearStoredUser, getStoredUser, setStoredUser } from '../utils/auth'

export function useAuth() {
  const [user, setUser] = useState(getStoredUser())

  const role = user?.role || 'guest'
  const isAdmin = user?.role === 'admin'
  const isPatient = user?.role === 'patient'
  const isDoctor = user?.role === 'doctor'
  const isGuest = !user

  async function login(username, password) {
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
  }

  function logout() {
    clearStoredUser()
    setUser(null)
  }

  return useMemo(
    () => ({ user, role, isAdmin, isPatient, isDoctor, isGuest, login, logout }),
    [user, role, isAdmin, isPatient, isDoctor, isGuest]
  )
}
