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
      throw new Error('Vui long nhap day du tai khoan va mat khau')
    }

    let users = []
    try {
      users = await api.get(endpoints.users)
    } catch {
      throw new Error('Khong ket noi duoc API. Vui long chay npm run server')
    }

    const found = users.find((item) => {
      const itemUsername = String(item.username || '').trim().toLowerCase()
      const itemPassword = String(item.password || '').trim()
      return itemUsername === safeUsername && itemPassword === safePassword
    })

    if (!found) {
      throw new Error('Sai tai khoan hoac mat khau')
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
