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
import {
  ClientTablePaginationFooter,
  ClientTableToolbar,
} from '../components/ClientTableControls'
import { useAuthContext } from '../hooks/useAuthContext'
import { useClientTableView } from '../hooks/useClientTableView'
import { joinSearchParts, scheduleDateFromString } from '../utils/tableMeta'
import { bookAppointment } from '../services/appointmentService'
import { canPatientBookAppointment } from '../utils/permissions'
import { bookingSchema, getFirstZodError } from '../utils/validationSchemas'

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
  const [patientName, setPatientName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [selectedScheduleId, setSelectedScheduleId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user?.fullName) setPatientName(user.fullName)
    if (user?.phone) setPhone(user.phone)
    if (user?.email) setEmail(user.email)
    if (user?.address) setAddress(user.address)
  }, [user])

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
        setError('Không tải được thông tin bác sĩ')
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

  const scheduleTableMeta = useMemo(
    () =>
      schedules.map((item) => {
        const isFull = item.currentSlot >= item.maxSlot
        return {
          search: joinSearchParts(
            item.id,
            item.date,
            item.time,
            getShiftLabel(item.time),
            item.room,
            item.currentSlot,
            item.maxSlot,
            item.status,
            isFull ? 'đầy' : 'còn chỗ'
          ),
          date: scheduleDateFromString(item.date),
        }
      }),
    [schedules]
  )

  const scheduleTableView = useClientTableView(schedules, scheduleTableMeta)

  async function refreshSchedules() {
    const [doctorData, scheduleData] = await Promise.all([
      api.get(`${endpoints.doctors}/${id}`),
      api.get(`${endpoints.schedules}?doctorId=${id}`),
    ])
    setDoctor(doctorData)
    setSchedules(scheduleData)
  }

  async function onBookingSubmit(event) {
    event.preventDefault()
    setError('')

    if (!user || !isPatient) {
      navigate('/login')
      return
    }
    if (!canPatientBookAppointment(user.role)) {
      setError('Chỉ tài khoản bệnh nhân mới được đặt lịch')
      return
    }

    const parsed = bookingSchema.safeParse({
      patientName,
      phone,
      email: String(email || '').trim(),
      address,
      note,
      selectedScheduleId,
    })
    if (!parsed.success) {
      setError(getFirstZodError(parsed.error))
      return
    }
    const bookingData = parsed.data

    const schedule = schedules.find((item) => String(item.id) === selectedScheduleId)
    if (!schedule || schedule.currentSlot >= schedule.maxSlot) {
      setError('Lịch này đã đầy')
      return
    }

    setSubmitting(true)
    try {
      const res = await bookAppointment({
        userId: user.id,
        doctorId: Number(id),
        scheduleId: Number(selectedScheduleId),
        patientName: bookingData.patientName,
        phone: bookingData.phone,
        email: bookingData.email || user.email || '',
        address: bookingData.address || user.address || '',
        note: bookingData.note || '',
      })
      if (!res.ok) {
        setError(res.error || 'Đặt lịch thất bại')
        return
      }
      toast.success('Đặt lịch thành công (chờ bác sĩ xác nhận)')
      setSelectedScheduleId('')
      setNote('')
      await refreshSchedules()
    } catch {
      setError('Đặt lịch thất bại, vui lòng thử lại')
    } finally {
      setSubmitting(false)
    }
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
      <BackButton fallback={backFallback} label="Danh sách bác sĩ" className="mb-3" />
      {error && <Alert variant="danger">{error}</Alert>}
      {!doctor ? (
        <Alert variant="warning">Không tìm thấy bác sĩ</Alert>
      ) : (
        <Row className="g-3">
          <Col lg={7}>
            <Card className="med-card">
              <Card.Body>
                <Card.Title className="d-flex justify-content-between align-items-center">
                  <span>{doctor.name}</span>
                  <Badge bg="info">{doctor.experience} năm kinh nghiệm</Badge>
                </Card.Title>
                <Card.Text className="text-muted mb-0">{doctor.bio}</Card.Text>
              </Card.Body>
            </Card>

            <Card className="mt-3 med-card">
              <Card.Body>
                <Card.Title>Lịch khám</Card.Title>
                <ClientTableToolbar
                  search={scheduleTableView.search}
                  onSearchChange={scheduleTableView.setSearch}
                  dateFrom={scheduleTableView.dateFrom}
                  onDateFromChange={scheduleTableView.setDateFrom}
                  dateTo={scheduleTableView.dateTo}
                  onDateToChange={scheduleTableView.setDateTo}
                  dateSortDir={scheduleTableView.dateSortDir}
                  onToggleDateSort={scheduleTableView.toggleDateSort}
                />
                <Table striped hover responsive className="mb-0">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Ngày</th>
                      <th>Ca</th>
                      <th>Giờ</th>
                      <th>Slot</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleTableView.pageRows.map((item, rowIdx) => {
                      const isFull = item.currentSlot >= item.maxSlot
                      return (
                        <tr key={item.id}>
                          <td>{scheduleTableView.rowStt(rowIdx)}</td>
                          <td>{item.date}</td>
                          <td>{getShiftLabel(item.time)}</td>
                          <td>{item.time}</td>
                          <td>
                            {item.currentSlot}/{item.maxSlot}
                          </td>
                          <td>
                            <Badge bg={isFull ? 'danger' : 'success'}>
                              {isFull ? 'đầy' : 'còn chỗ'}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                    {schedules.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">
                          Chưa có lịch khám
                        </td>
                      </tr>
                    )}
                    {schedules.length > 0 && scheduleTableView.pageRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">
                          Không có dòng nào khớp bộ lọc
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
                <ClientTablePaginationFooter
                  page={scheduleTableView.page}
                  totalPages={scheduleTableView.totalPages}
                  onPageChange={scheduleTableView.setPage}
                  totalFiltered={scheduleTableView.totalFiltered}
                  pageSize={scheduleTableView.pageSize}
                />
              </Card.Body>
            </Card>
          </Col>

          <Col lg={5}>
            <Card className="med-card">
              <Card.Body>
                <Card.Title>Đặt lịch khám</Card.Title>
                {!user && (
                  <Alert variant="info" className="small">
                    Vui lòng đăng nhập tài khoản bệnh nhân để đặt lịch.
                  </Alert>
                )}
                <Form onSubmit={onBookingSubmit}>
                  <Form.Group className="mb-2">
                    <Form.Label>Tên bệnh nhân</Form.Label>
                    <Form.Control
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Số điện thoại</Form.Label>
                    <Form.Control value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Tự động lấy từ hồ sơ nếu để trống"
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Địa chỉ</Form.Label>
                    <Form.Control
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Địa chỉ liên hệ khi khám"
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Ghi chú / lý do khám</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Chọn lịch</Form.Label>
                    <Form.Select
                      value={selectedScheduleId}
                      onChange={(e) => setSelectedScheduleId(e.target.value)}
                    >
                      <option value="">— Chọn —</option>
                      {availableSchedules.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.date} - {getShiftLabel(item.time)}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Button
                    type="submit"
                    disabled={availableSchedules.length === 0 || submitting}
                  >
                    {submitting ? 'Đang gửi…' : 'Xác nhận đặt lịch'}
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
