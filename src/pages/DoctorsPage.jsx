import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Row,
  Spinner,
} from 'react-bootstrap'
import { Link, useSearchParams } from 'react-router-dom'
import BackButton from '../components/BackButton'
import { api } from '../api/client'
import { endpoints } from '../api/config'

function DoctorsPage({ detailBasePath = '/doctors' }) {
  const [searchParams] = useSearchParams()
  const [doctors, setDoctors] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [specialtyId, setSpecialtyId] = useState(searchParams.get('specialtyId') || '')
  const [sortBy, setSortBy] = useState('name')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const [doctorData, specialtyData] = await Promise.all([
          api.get(endpoints.doctors),
          api.get(endpoints.specialties),
        ])
        setDoctors(doctorData)
        setSpecialties(specialtyData)
      } catch {
        setError('Khong tai duoc danh sach bac si')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredDoctors = useMemo(() => {
    let result = doctors
    if (specialtyId) {
      result = result.filter((doctor) => String(doctor.specialtyId) === specialtyId)
    }
    const sorted = [...result].sort((a, b) => {
      if (sortBy === 'experience') return b.experience - a.experience
      return a.name.localeCompare(b.name)
    })
    return sorted
  }, [doctors, specialtyId, sortBy])

  return (
    <Container className="py-2 medilab-page">
      <BackButton fallback="/" label="Home" className="mb-3" />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Danh sach bac si</h3>
        <Badge bg="secondary">{filteredDoctors.length} ket qua</Badge>
      </div>
      <Card className="mb-3 med-card">
        <Card.Body>
          <Row className="g-2">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>Chuyen khoa</InputGroup.Text>
                <Form.Select
                  value={specialtyId}
                  onChange={(e) => setSpecialtyId(e.target.value)}
                >
                  <option value="">Tat ca</option>
                  {specialties.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>Sap xep</InputGroup.Text>
                <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="name">Theo ten</option>
                  <option value="experience">Theo kinh nghiem</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={4} className="d-grid d-md-flex justify-content-md-end">
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSpecialtyId('')
                  setSortBy('name')
                }}
              >
                Reset
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading && (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      )}
      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <Row>
          {filteredDoctors.map((doctor) => (
            <Col md={4} className="mb-3" key={doctor.id}>
              <Card className="h-100 med-card">
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="d-flex justify-content-between">
                    <span>{doctor.name}</span>
                    <Badge bg="info">{doctor.experience} nam</Badge>
                  </Card.Title>
                  <Card.Text className="text-muted flex-grow-1">{doctor.bio}</Card.Text>
                  <Button as={Link} to={`${detailBasePath}/${doctor.id}`} size="sm">
                    Xem chi tiet
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
          {filteredDoctors.length === 0 && (
            <Col>
              <Alert variant="warning">Khong co bac si phu hop bo loc.</Alert>
            </Col>
          )}
        </Row>
      )}
    </Container>
  )
}

export default DoctorsPage
