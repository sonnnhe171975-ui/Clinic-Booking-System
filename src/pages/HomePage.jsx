import { Button, Card, Carousel, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'

function HomePage() {
  const { role } = useAuthContext()
  const dashboardLink = role === 'admin' ? '/admin' : '/patient'

  return (
    <Container className="medilab-page py-2">
      <div className="medilab-hero">
        <h2 className="mb-2">He thong dat lich kham benh</h2>
        <p className="mb-3">
          Dat lich nhanh, theo doi lich hen, quan ly bac si va lich kham theo tung vai tro.
        </p>
        <div className="d-flex gap-2 flex-wrap">
          <Button as={Link} to="/doctors">Dat lich ngay</Button>
          <Button as={Link} to={role === 'guest' ? '/login' : dashboardLink} variant="outline-light">
            {role === 'guest' ? 'Dang nhap' : 'Chuyen den dashboard'}
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
              <h5>Dat lich nhanh gon</h5>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100 home-slider-image"
              src="/custom-slider/slide-2.png"
              alt="slide 2"
            />
            <Carousel.Caption>
              <h5>Cham soc tan tam</h5>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100 home-slider-image"
              src="/custom-slider/slide-3.png"
              alt="slide 3"
            />
            <Carousel.Caption>
              <h5>Doi ngu bac si chat luong</h5>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>
      </Card>

      <Row className="g-3">
        <Col md={4}>
          <Card className="med-card h-100">
            <Card.Body>
              <Card.Title>Bac si chat luong</Card.Title>
              <Card.Text className="text-muted">
                Danh sach bac si theo chuyen khoa, thong tin chi tiet va kinh nghiem.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="med-card h-100">
            <Card.Body>
              <Card.Title>Lich kham linh hoat</Card.Title>
              <Card.Text className="text-muted">
                Xem slot trong theo ngay/gio va dat lich ngay tren he thong.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="med-card h-100">
            <Card.Body>
              <Card.Title>Quan ly minh bach</Card.Title>
              <Card.Text className="text-muted">
                Admin theo doi specialties, doctors, schedules, appointments theo dashboard.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default HomePage
