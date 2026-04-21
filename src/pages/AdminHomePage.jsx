import { Badge, Button, Card, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const cards = [
  { to: '/admin/specialties', title: 'Specialty CRUD' },
  { to: '/admin/doctors', title: 'Doctor CRUD' },
  { to: '/admin/schedules', title: 'Schedule CRUD' },
  { to: '/admin/users', title: 'User CRUD' },
  { to: '/admin/appointments', title: 'Appointment List' },
]

function AdminHomePage() {
  return (
    <Container className="py-2 medilab-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Trang quan tri</h3>
        <Badge bg="dark">Admin</Badge>
      </div>
      <Row>
        {cards.map((item) => (
          <Col md={4} lg={3} key={item.to}>
            <Card className="mb-3 med-card h-100">
              <Card.Body className="d-flex flex-column">
                <Card.Title>{item.title}</Card.Title>
                <Card.Text className="text-muted flex-grow-1">
                  Quan ly du lieu trong module {item.title}.
                </Card.Text>
                <Button as={Link} to={item.to} variant="outline-primary">
                  Mo module
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  )
}

export default AdminHomePage
