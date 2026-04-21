import { Badge, Button, Container, Nav, Navbar } from 'react-bootstrap'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'

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
        <Navbar.Brand as={Link} to="/" className="fw-semibold d-flex align-items-center gap-2">
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
            <Nav.Link as={NavLink} to="/">
              Home
            </Nav.Link>
            <Nav.Link as={NavLink} to="/about">
              About
            </Nav.Link>
            <Nav.Link as={NavLink} to="/specialties">
              Chuyen khoa
            </Nav.Link>
            <Nav.Link as={NavLink} to="/doctors">
              Bac si
            </Nav.Link>
            {isAdmin && (
              <Nav.Link as={NavLink} to="/admin">
                Quan tri
              </Nav.Link>
            )}
            {isPatient && (
              <Nav.Link as={NavLink} to="/patient">
                Dashboard
              </Nav.Link>
            )}
            {isDoctor && (
              <Nav.Link as={NavLink} to="/doctor">
                Doctor Panel
              </Nav.Link>
            )}
          </Nav>
          <div className="d-flex align-items-center gap-2">
            {user ? (
              <>
                <span className="small">{user.fullName}</span>
                <Badge
                  bg={isAdmin ? 'warning' : isDoctor ? 'primary' : 'info'}
                  text={isAdmin ? 'dark' : 'light'}
                >
                  {role}
                </Badge>
                <Button size="sm" variant="outline-primary" onClick={onLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Badge bg="secondary">guest</Badge>
                <Button as={Link} to="/login" size="sm" variant="outline-primary">
                Login
                </Button>
                <Button as={Link} to="/register" size="sm" variant="primary">
                  Register
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
