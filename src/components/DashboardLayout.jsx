import { Badge, Container, Nav } from 'react-bootstrap'
import { Link, NavLink } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import BackButton from './BackButton'

function DashboardLayout({ role, title, children }) {
  const { user } = useAuthContext()

  const menuItems =
    role === 'admin'
      ? [
          { to: '/admin', label: 'Tổng quan', end: true },
          { to: '/admin/specialties', label: 'Chuyên khoa' },
          { to: '/admin/doctors', label: 'Bác sĩ' },
          { to: '/admin/schedules', label: 'Lịch khám' },
          { to: '/admin/users', label: 'Người dùng' },
          { to: '/admin/appointments', label: 'Lịch hẹn' },
        ]
      : role === 'doctor'
      ? [{ to: '/doctor', label: 'Lịch đăng ký', end: true }]
      : [
          { to: '/patient', label: 'Trang chủ', end: true },
          { to: '/patient/appointments', label: 'Lịch hẹn của tôi' },
          { to: '/patient/doctors', label: 'Đặt lịch khám' },
        ]
  const defaultBack =
    role === 'admin' ? '/admin' : role === 'doctor' ? '/doctor' : '/patient'

  return (
    <Container fluid className="px-3 px-md-4 pb-4">
      <div className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6 className="mb-0">Menu</h6>
            <Badge bg={role === 'admin' ? 'warning' : 'info'} text={role === 'admin' ? 'dark' : 'light'}>
              {role}
            </Badge>
          </div>
          <Nav className="flex-column gap-1">
            {menuItems.map((item) => (
              <Nav.Link as={NavLink} key={item.to} to={item.to} end={item.end} className="dashboard-link">
                {item.label}
              </Nav.Link>
            ))}
          </Nav>
        </aside>

        <section className="dashboard-main">
          <header className="dashboard-header">
            <div>
              <BackButton fallback={defaultBack} className="mb-2" />
              <h4 className="mb-1">{title}</h4>
              <small className="text-muted">Xin chào, {user?.fullName}</small>
            </div>
            <Link to="/" className="btn btn-sm btn-outline-primary">
              Về trang chủ
            </Link>
          </header>

          <main className="dashboard-content">{children}</main>

          <footer className="dashboard-footer text-muted small">
            Clinic Booking — Bảng điều khiển
          </footer>
        </section>
      </div>
    </Container>
  )
}

export default DashboardLayout
