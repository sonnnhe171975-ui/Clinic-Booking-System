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
              Nền tảng đặt lịch khám bệnh trực tuyến cho bệnh nhân và phòng khám.
            </p>
          </Col>
          <Col md={4}>
            <h6 className="mb-2">Liên kết nhanh</h6>
            <div className="d-flex flex-column gap-1 small">
              <Link to="/">Trang chủ</Link>
              <Link to="/about">Giới thiệu</Link>
              <Link to="/doctors">Đặt lịch khám</Link>
            </div>
          </Col>
          <Col md={4}>
            <h6 className="mb-2">Thông tin liên hệ</h6>
            <p className="small mb-1">Địa chỉ: 123 Nguyễn Văn Linh, Đà Nẵng</p>
            <p className="small mb-1">Hotline: 1900 565656</p>
            <p className="small mb-0">Email: support@clinicbooking.vn</p>
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

export default AppFooter
