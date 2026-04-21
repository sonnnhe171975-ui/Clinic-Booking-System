import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import BackButton from '../components/BackButton'
import { api } from '../api/client'
import { endpoints } from '../api/config'

function SpecialtiesPage() {
  const [specialties, setSpecialties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.get(endpoints.specialties)
        setSpecialties(data)
      } catch {
        setError('Không tải được danh sách chuyên khoa')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <Container className="py-2 medilab-page">
      <BackButton fallback="/" label="Trang chủ" className="mb-3" />
      <div className="medilab-hero">
        <h2 className="mb-2">Đặt lịch khám bệnh trực tuyến</h2>
        <p className="mb-0">Chọn chuyên khoa phù hợp và tiếp tục đến bác sĩ.</p>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Danh sách chuyên khoa</h3>
        <Badge bg="secondary">{specialties.length} chuyên khoa</Badge>
      </div>

      {loading && (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
      {!loading && !error && specialties.length === 0 && (
        <Alert variant="warning">Chưa có chuyên khoa nào trong hệ thống.</Alert>
      )}

      <Row>
        {specialties.map((item) => (
          <Col md={6} key={item.id} className="mb-3">
            <Card className="h-100 med-card">
              <Card.Body>
                <Card.Title className="d-flex justify-content-between align-items-center">
                  <span>{item.name}</span>
                  <Badge bg="primary">ID {item.id}</Badge>
                </Card.Title>
                <Card.Text className="text-muted">{item.description}</Card.Text>
                <Button as={Link} to={`/doctors?specialtyId=${item.id}`} variant="outline-primary">
                  Xem bác sĩ
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  )
}

export default SpecialtiesPage
