import { Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'

function AppFooter() {
  return (
    <footer className="app-footer mt-4">
      <Container className="py-4">
        <Row className="g-3">
          <Col md={4}>
            <h6 className="mb-2">Clinic Booking System</h6>
            <p className="small text-muted mb-0">
              Nen tang dat lich kham benh truc tuyen cho benh nhan va phong kham.
            </p>
          </Col>
          <Col md={4}>
            <h6 className="mb-2">Lien ket nhanh</h6>
            <div className="d-flex flex-column gap-1 small">
              <Link to="/">Home</Link>
              <Link to="/about">About</Link>
              <Link to="/doctors">Dat lich kham</Link>
            </div>
          </Col>
          <Col md={4}>
            <h6 className="mb-2">Thong tin lien he</h6>
            <p className="small mb-1">Dia chi: 123 Nguyen Van Linh, Da Nang</p>
            <p className="small mb-1">Hotline: 1900 565656</p>
            <p className="small mb-0">Email: support@clinicbooking.vn</p>
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

export default AppFooter
