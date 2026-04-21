import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api } from '../api/client'
import { endpoints } from '../api/config'
import BackButton from '../components/BackButton'
import { useAuthContext } from '../hooks/useAuthContext'

const SHIFT_OPTIONS = [
  { code: 'ca1', label: 'Ca 1', time: '07:00-10:00' },
  { code: 'ca2', label: 'Ca 2', time: '10:00-12:20' },
  { code: 'ca3', label: 'Ca 3', time: '12:50-15:00' },
  { code: 'ca4', label: 'Ca 4', time: '15:30-17:40' },
]

function getShiftLabel(time) {
  const shift = SHIFT_OPTIONS.find((item) => item.time === time)
  return shift ? `${shift.label} (${shift.time})` : time
}

function DoctorDetailPage({ backFallback = '/doctors' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isPatient } = useAuthContext()
  const [doctor, setDoctor] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [patientName, setPatientName] = useState(user?.fullName || '')
  const [phone, setPhone] = useState('')
  const [selectedScheduleId, setSelectedScheduleId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [doctorData, scheduleData] = await Promise.all([
          api.get(`${endpoints.doctors}/${id}`),
          api.get(`${endpoints.schedules}?doctorId=${id}`),
        ])
        setDoctor(doctorData)
        setSchedules(scheduleData)
      } catch {
        setError('Khong tai duoc thong tin bac si')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const availableSchedules = useMemo(
    () => schedules.filter((item) => item.currentSlot < item.maxSlot),
    [schedules]
  )

  async function onBookingSubmit(event) {
    event.preventDefault()
    setError('')

    if (!user || !isPatient) {
      navigate('/login')
      return
    }
    if (!patientName || !phone || !selectedScheduleId) {
      setError('Vui long nhap du thong tin')
      return
    }
    if (!/^\d{9,11}$/.test(phone)) {
      setError('So dien thoai khong hop le')
      return
    }

    const schedule = schedules.find((item) => String(item.id) === selectedScheduleId)
    if (!schedule || schedule.currentSlot >= schedule.maxSlot) {
      setError('Lich nay da full')
      return
    }

    const duplicateCheck = await api.get(
      `${endpoints.appointments}?userId=${user.id}&scheduleId=${selectedScheduleId}`
    )
    if (duplicateCheck.length > 0) {
      setError('Ban da dat lich nay roi')
      return
    }

    await api.post(endpoints.appointments, {
      userId: user.id,
      doctorId: Number(id),
      scheduleId: Number(selectedScheduleId),
      patientName,
      phone,
      createdAt: new Date().toISOString(),
    })

    const nextCurrentSlot = schedule.currentSlot + 1
    await api.put(`${endpoints.schedules}/${schedule.id}`, {
      ...schedule,
      currentSlot: nextCurrentSlot,
      status: nextCurrentSlot >= schedule.maxSlot ? 'full' : 'available',
    })

    toast.success('Dat lich thanh cong')
    setPhone('')
    setSelectedScheduleId('')
    const [doctorData, scheduleData] = await Promise.all([
      api.get(`${endpoints.doctors}/${id}`),
      api.get(`${endpoints.schedules}?doctorId=${id}`),
    ])
    setDoctor(doctorData)
    setSchedules(scheduleData)
  }

  if (loading) {
    return (
      <Container className="text-center py-4">
        <Spinner animation="border" />
      </Container>
    )
  }

  return (
    <Container className="py-2 medilab-page">
      <BackButton fallback={backFallback} label="Danh sach bac si" className="mb-3" />
      {error && <Alert variant="danger">{error}</Alert>}
      {!doctor ? (
        <Alert variant="warning">Khong tim thay bac si</Alert>
      ) : (
        <Row className="g-3">
          <Col lg={7}>
            <Card className="med-card">
              <Card.Body>
                <Card.Title className="d-flex justify-content-between align-items-center">
                  <span>{doctor.name}</span>
                  <Badge bg="info">{doctor.experience} nam kinh nghiem</Badge>
                </Card.Title>
                <Card.Text className="text-muted mb-0">{doctor.bio}</Card.Text>
              </Card.Body>
            </Card>

            <Card className="mt-3 med-card">
              <Card.Body>
                <Card.Title>Lich kham</Card.Title>
                <Table striped hover responsive className="mb-0">
                  <thead>
                    <tr>
                      <th>Ngay</th>
                      <th>Ca</th>
                      <th>Gio</th>
                      <th>Slot</th>
                      <th>Trang thai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((item) => {
                      const isFull = item.currentSlot >= item.maxSlot
                      return (
                        <tr key={item.id}>
                          <td>{item.date}</td>
                          <td>{getShiftLabel(item.time)}</td>
                          <td>{item.time}</td>
                          <td>
                            {item.currentSlot}/{item.maxSlot}
                          </td>
                          <td>
                            <Badge bg={isFull ? 'danger' : 'success'}>
                              {isFull ? 'full' : 'available'}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={5}>
            <Card className="med-card">
              <Card.Body>
                <Card.Title>Dat lich kham</Card.Title>
                {!user && (
                  <Alert variant="info" className="small">
                    Vui long dang nhap tai khoan patient de dat lich.
                  </Alert>
                )}
                <Form onSubmit={onBookingSubmit}>
                  <Form.Group className="mb-2">
                    <Form.Label>Ten benh nhan</Form.Label>
                    <Form.Control
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>So dien thoai</Form.Label>
                    <Form.Control value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Chon lich</Form.Label>
                    <Form.Select
                      value={selectedScheduleId}
                      onChange={(e) => setSelectedScheduleId(e.target.value)}
                    >
                      <option value="">-- Chon --</option>
                      {availableSchedules.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.date} - {getShiftLabel(item.time)}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Button type="submit" disabled={availableSchedules.length === 0}>
                    Xac nhan dat lich
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  )
}

export default DoctorDetailPage
