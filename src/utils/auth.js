const AUTH_KEY = 'clinic_auth_user'

export function getStoredUser() {
  const raw = localStorage.getItem(AUTH_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setStoredUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
}

export function clearStoredUser() {
  localStorage.removeItem(AUTH_KEY)
}
