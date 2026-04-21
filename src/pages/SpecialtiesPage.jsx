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
        setError('Khong tai duoc danh sach chuyen khoa')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <Container className="py-2 medilab-page">
      <BackButton fallback="/" label="Home" className="mb-3" />
      <div className="medilab-hero">
        <h2 className="mb-2">Dat lich kham benh truc tuyen</h2>
        <p className="mb-0">Chon chuyen khoa phu hop va tiep tuc den bac si.</p>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Danh sach chuyen khoa</h3>
        <Badge bg="secondary">{specialties.length} chuyen khoa</Badge>
      </div>

      {loading && (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
      {!loading && !error && specialties.length === 0 && (
        <Alert variant="warning">Chua co chuyen khoa nao trong he thong.</Alert>
      )}

      <Row>
        {specialties.map((item) => (
          <Col md={4} key={item.id} className="mb-3">
            <Card className="h-100 med-card">
              <Card.Body>
                <Card.Title className="d-flex justify-content-between align-items-center">
                  <span>{item.name}</span>
                  <Badge bg="primary">ID {item.id}</Badge>
                </Card.Title>
                <Card.Text className="text-muted">{item.description}</Card.Text>
                <Button as={Link} to={`/doctors?specialtyId=${item.id}`} variant="outline-primary">
                  Xem bac si
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
