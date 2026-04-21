import { Badge, Container, Nav } from 'react-bootstrap'
import { Link, NavLink } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import BackButton from './BackButton'

function DashboardLayout({ role, title, children }) {
  const { user } = useAuthContext()

  const menuItems =
    role === 'admin'
      ? [
          { to: '/admin', label: 'Tong quan', end: true },
          { to: '/admin/specialties', label: 'Specialties' },
          { to: '/admin/doctors', label: 'Doctors' },
          { to: '/admin/schedules', label: 'Schedules' },
          { to: '/admin/users', label: 'Users' },
          { to: '/admin/appointments', label: 'Appointments' },
        ]
      : role === 'doctor'
      ? [
          { to: '/doctor', label: 'Lich dang ky', end: true },
          { to: '/doctor/patients', label: 'Ho so benh nhan' },
        ]
      : [
          { to: '/patient', label: 'Trang chu', end: true },
          { to: '/patient/appointments', label: 'Lich hen cua toi' },
          { to: '/patient/doctors', label: 'Dat lich kham' },
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
              <small className="text-muted">Xin chao, {user?.fullName}</small>
            </div>
            <Link to="/" className="btn btn-sm btn-outline-primary">
              Ve trang Home
            </Link>
          </header>

          <main className="dashboard-content">{children}</main>

          <footer className="dashboard-footer text-muted small">
            Clinic Booking Dashboard - Powered by Flexy style layout
          </footer>
        </section>
      </div>
    </Container>
  )
}

export default DashboardLayout
