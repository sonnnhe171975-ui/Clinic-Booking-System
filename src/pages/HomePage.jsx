import { Button, Card, Carousel, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'

function HomePage() {
  const { role } = useAuthContext()
  const dashboardLink =
    role === 'admin' ? '/admin' : role === 'doctor' ? '/doctor' : '/patient'

  return (
    <Container className="medilab-page py-2">
      <div className="medilab-hero">
        <h2 className="mb-2">Hệ thống đặt lịch khám bệnh</h2>
        <p className="mb-3">
          Đặt lịch nhanh, theo dõi lịch hẹn, quản lý bác sĩ và lịch khám theo từng vai trò.
        </p>
        <div className="d-flex gap-2 flex-wrap">
          <Button as={Link} to="/doctors">
            Đặt lịch ngay
          </Button>
          <Button as={Link} to={role === 'guest' ? '/login' : dashboardLink} variant="outline-light">
            {role === 'guest' ? 'Đăng nhập' : 'Chuyển đến bảng điều khiển'}
          </Button>
        </div>
      </div>

      <Card className="med-card mb-3 overflow-hidden">
        <Carousel fade indicators controls={false} interval={2800}>
          <Carousel.Item>
            <img
              className="d-block w-100 home-slider-image"
              src="/custom-slider/slide-1.png"
              alt="slide 1"
            />
            <Carousel.Caption>
              <h5>Đặt lịch nhanh gọn</h5>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100 home-slider-image"
              src="/custom-slider/slide-2.png"
              alt="slide 2"
            />
            <Carousel.Caption>
              <h5>Chăm sóc tận tâm</h5>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100 home-slider-image"
              src="/custom-slider/slide-3.png"
              alt="slide 3"
            />
            <Carousel.Caption>
              <h5>Đội ngũ bác sĩ chất lượng</h5>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>
      </Card>

      <Row className="g-3">
        <Col md={4}>
          <Card className="med-card h-100">
            <Card.Body>
              <Card.Title>Bác sĩ chất lượng</Card.Title>
              <Card.Text className="text-muted">
                Danh sách bác sĩ theo chuyên khoa, thông tin chi tiết và kinh nghiệm.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="med-card h-100">
            <Card.Body>
              <Card.Title>Lịch khám linh hoạt</Card.Title>
              <Card.Text className="text-muted">
                Xem slot trống theo ngày/giờ và đặt lịch ngay trên hệ thống.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="med-card h-100">
            <Card.Body>
              <Card.Title>Quản lý minh bạch</Card.Title>
              <Card.Text className="text-muted">
                Quản trị viên theo dõi chuyên khoa, bác sĩ, lịch khám và lịch hẹn qua bảng điều
                khiển.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default HomePage
