import { Badge, Button, Dropdown } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import { useAppState } from '../state/useAppState'

function NotificationCenter() {
  const { user } = useAuthContext()
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshNotifications,
  } = useAppState()

  if (!user) return null

  return (
    <Dropdown align="end">
      <Dropdown.Toggle variant="outline-secondary" size="sm" id="notification-center-toggle">
        Thông báo {unreadCount > 0 && <Badge bg="danger">{unreadCount}</Badge>}
      </Dropdown.Toggle>
      <Dropdown.Menu style={{ minWidth: '22rem', maxWidth: '24rem' }}>
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <strong className="small">Thông báo hệ thống</strong>
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="link"
              size="sm"
              className="p-0 text-decoration-none"
              onClick={markAllNotificationsAsRead}
            >
              Đánh dấu đã đọc
            </Button>
            <Button
              variant="link"
              size="sm"
              className="p-0 text-decoration-none"
              onClick={() => refreshNotifications()}
            >
              Làm mới
            </Button>
          </div>
        </div>
        {notifications.length === 0 ? (
          <div className="px-3 py-3 small text-muted">Chưa có thông báo nào.</div>
        ) : (
          notifications.map((item) => (
            <Dropdown.Item
              as={Link}
              to={item.to}
              key={item.id}
              onClick={() => markNotificationAsRead(item.id)}
              className="py-2 border-bottom"
            >
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div className="small">
                  <div className="fw-semibold">{item.title}</div>
                  <div className="text-muted">{item.subtitle}</div>
                </div>
                {!item.isRead && <Badge bg="primary">mới</Badge>}
              </div>
            </Dropdown.Item>
          ))
        )}
      </Dropdown.Menu>
    </Dropdown>
  )
}

export default NotificationCenter
