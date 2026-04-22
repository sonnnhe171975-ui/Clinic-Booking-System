import { api } from '../api/client'
import { endpoints } from '../api/config'

function normalizeDate(value) {
  if (!value) return 0
  const ts = new Date(value).getTime()
  return Number.isNaN(ts) ? 0 : ts
}

function deriveTargetPath(item) {
  if (item.to) return item.to
  if (item.type === 'pending_appointment' && item.relatedId) {
    return `/doctor?appointmentId=${encodeURIComponent(item.relatedId)}`
  }
  if (item.type === 'appointment_status') return '/patient/appointments'
  if (item.type === 'admin_pending') return '/admin/appointments'
  return '/'
}

export async function fetchNotificationsForUser(user) {
  if (!user?.id) return []
  const list = await api.get(`${endpoints.notifications}?userId=${encodeURIComponent(user.id)}`)
  return [...list]
    .map((item) => ({
      ...item,
      to: deriveTargetPath(item),
      isRead: Boolean(item.isRead),
    }))
    .sort((a, b) => normalizeDate(b.createdAt) - normalizeDate(a.createdAt))
    .slice(0, 20)
}

export async function markNotificationAsRead(notificationId) {
  const raw = await api.get(`${endpoints.notifications}/${notificationId}`)
  if (raw?.isRead) return raw
  return api.put(`${endpoints.notifications}/${notificationId}`, { ...raw, isRead: true })
}

export async function markAllNotificationsAsReadByUser(userId) {
  if (!userId) return
  const list = await api.get(`${endpoints.notifications}?userId=${encodeURIComponent(userId)}&isRead=false`)
  await Promise.all(
    list.map((item) =>
      api.put(`${endpoints.notifications}/${item.id}`, {
        ...item,
        isRead: true,
      })
    )
  )
}
