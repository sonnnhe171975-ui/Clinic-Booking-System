import { Badge, Button, Container, Nav, Navbar } from 'react-bootstrap'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import NotificationCenter from './NotificationCenter'

function AppNavbar() {
  const { user, role, isAdmin, isPatient, isDoctor, logout } = useAuthContext()
  const navigate = useNavigate()

  function onLogout() {
    logout()
    navigate('/login')
  }

  return (
    <Navbar bg="light" expand="lg" className="shadow-sm mb-4 border-bottom">
      <Container>
        <Navbar.Brand
          as={Link}
          to={isDoctor ? '/doctor' : '/'}
          className="fw-semibold d-flex align-items-center gap-2"
        >
          <img
            src="/medilab/MediLab-1.0.0/assets/img/logo.png"
            alt="logo"
            width="30"
            height="30"
          />
          Clinic Booking System
        </Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse>
          <Nav className="me-auto">
            {!isDoctor && (
              <>
                <Nav.Link as={NavLink} to="/">
                  Trang chủ
                </Nav.Link>
                <Nav.Link as={NavLink} to="/about">
                  Giới thiệu
                </Nav.Link>
                <Nav.Link as={NavLink} to="/specialties">
                  Chuyên khoa
                </Nav.Link>
                <Nav.Link as={NavLink} to="/doctors">
                  Bác sĩ
                </Nav.Link>
              </>
            )}
            {isAdmin && (
              <Nav.Link as={NavLink} to="/admin">
                Quản trị
              </Nav.Link>
            )}
            {isPatient && (
              <Nav.Link as={NavLink} to="/patient">
                Bảng điều khiển
              </Nav.Link>
            )}
            {isDoctor && (
              <Nav.Link as={NavLink} to="/doctor" end>
                Lịch làm việc
              </Nav.Link>
            )}
          </Nav>
          <div className="d-flex align-items-center gap-2">
            {user ? (
              <>
                <NotificationCenter />
                <span className="small">{user.fullName}</span>
                <Badge
                  bg={isAdmin ? 'warning' : isDoctor ? 'primary' : 'info'}
                  text={isAdmin ? 'dark' : 'light'}
                >
                  {role}
                </Badge>
                <Button size="sm" variant="outline-primary" onClick={onLogout}>
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Badge bg="secondary">khách</Badge>
                <Button as={Link} to="/login" size="sm" variant="outline-primary">
                  Đăng nhập
                </Button>
                <Button as={Link} to="/register" size="sm" variant="primary">
                  Đăng ký
                </Button>
              </>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

export default AppNavbar
