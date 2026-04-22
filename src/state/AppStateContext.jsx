import { useCallback, useEffect, useReducer } from 'react'
import { useAuthContext } from '../hooks/useAuthContext'
import {
  fetchNotificationsForUser,
  markAllNotificationsAsReadByUser,
  markNotificationAsRead as markNotificationAsReadApi,
} from '../services/notificationService'
import { AppStateContext } from './appStateContextInstance'

const initialState = {
  notifications: [],
  loadingNotifications: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'notifications/loading':
      return { ...state, loadingNotifications: true }
    case 'notifications/set':
      return { ...state, loadingNotifications: false, notifications: action.payload || [] }
    default:
      return state
  }
}

export function AppStateProvider({ children }) {
  const { user } = useAuthContext()
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    if (!user?.id) {
      dispatch({ type: 'notifications/set', payload: [] })
      return
    }
  }, [user?.id])

  const refreshNotifications = useCallback(async () => {
    if (!user) return
    dispatch({ type: 'notifications/loading' })
    const list = await fetchNotificationsForUser(user)
    dispatch({ type: 'notifications/set', payload: list })
  }, [user])

  useEffect(() => {
    if (!user) return undefined
    refreshNotifications().catch(() => {
      dispatch({ type: 'notifications/set', payload: [] })
    })
    const timer = setInterval(() => {
      refreshNotifications().catch(() => {
        /* ignore polling error */
      })
    }, 8000)
    return () => clearInterval(timer)
  }, [refreshNotifications, user])

  const unreadCount = state.notifications.filter((item) => !item.isRead).length

  async function markNotificationAsRead(id) {
    if (!user?.id || !id) return
    await markNotificationAsReadApi(id)
    dispatch({
      type: 'notifications/set',
      payload: state.notifications.map((item) =>
        String(item.id) === String(id) ? { ...item, isRead: true } : item
      ),
    })
  }

  async function markAllNotificationsAsRead() {
    if (!user?.id || !state.notifications.length) return
    await markAllNotificationsAsReadByUser(user.id)
    dispatch({
      type: 'notifications/set',
      payload: state.notifications.map((item) => ({ ...item, isRead: true })),
    })
  }

  const value = {
    notifications: state.notifications,
    unreadCount,
    loadingNotifications: state.loadingNotifications,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

