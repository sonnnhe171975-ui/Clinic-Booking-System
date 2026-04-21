import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Table } from 'react-bootstrap'
import { api } from '../api/client'
import { endpoints } from '../api/config'
import { useAuthContext } from '../hooks/useAuthContext'

const SHIFT_OPTIONS = [
  { code: 'ca1', label: 'Ca 1', time: '07:00-10:00' },
  { code: 'ca2', label: 'Ca 2', time: '10:00-12:20' },
  { code: 'ca3', label: 'Ca 3', time: '12:50-15:00' },
  { code: 'ca4', label: 'Ca 4', time: '15:30-17:40' },
]

function toDateKey(date) {
  return date.toISOString().split('T')[0]
}

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function DoctorAppointmentsPage() {
  const { user } = useAuthContext()
  const [appointments, setAppointments] = useState([])
  const [users, setUsers] = useState([])
  const [schedules, setSchedules] = useState([])
  const [doctors, setDoctors] = useState([])
  const [error, setError] = useState('')
  const [searchText, setSearchText] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    async function loadData() {
      try {
        const [appointmentData, userData, scheduleData, doctorData] = await Promise.all([
          api.get(endpoints.appointments),
          api.get(endpoints.users),
          api.get(endpoints.schedules),
          api.get(endpoints.doctors),
        ])
        setAppointments(appointmentData)
        setUsers(userData)
        setSchedules(scheduleData)
        setDoctors(doctorData)
      } catch {
        setError('Khong tai duoc du lieu lich hen')
      }
    }
    loadData()
  }, [])

  const doctorProfile = useMemo(() => {
    const byDoctorId = doctors.find((item) => String(item.id) === String(user?.doctorId))
    if (byDoctorId) return byDoctorId
    return doctors.find((item) => item.email === user?.email) || null
  }, [doctors, user])

  const doctorAppointments = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()

    const list = appointments
      .filter((item) => String(item.doctorId) === String(doctorProfile?.id))
      .map((item) => {
        const schedule = schedules.find((s) => String(s.id) === String(item.scheduleId))
        const patient = users.find((u) => String(u.id) === String(item.userId))
        return { ...item, schedule, patient }
      })

    if (!keyword) return list
    return list.filter((item) =>
      String(item.patientName || item.patient?.fullName || '')
        .toLowerCase()
        .includes(keyword)
    )
  }, [appointments, schedules, users, doctorProfile, searchText])

  const doctorSchedules = useMemo(
    () => schedules.filter((item) => String(item.doctorId) === String(doctorProfile?.id)),
    [schedules, doctorProfile]
  )

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date())
    start.setDate(start.getDate() + weekOffset * 7)
    return Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(start)
      d.setDate(start.getDate() + idx)
      return d
    })
  }, [weekOffset])

  const weekLabel = useMemo(() => {
    if (!weekDays.length) return ''
    const first = weekDays[0].toLocaleDateString('vi-VN')
    const last = weekDays[6].toLocaleDateString('vi-VN')
    return `${first} - ${last}`
  }, [weekDays])

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row className="g-3 mb-3">
        <Col md={4}>
          <Card className="med-card">
            <Card.Body>
              <Card.Title className="small text-uppercase text-muted">Bac si</Card.Title>
              <h5 className="mb-1">{doctorProfile?.name || user?.fullName}</h5>
              <small className="text-muted">{doctorProfile?.degree || 'Doctor account'}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="med-card">
            <Card.Body>
              <Card.Title className="small text-uppercase text-muted">Tong lich dang ky</Card.Title>
              <h4 className="mb-0">{doctorAppointments.length}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="med-card">
            <Card.Body>
              <Card.Title className="small text-uppercase text-muted">Loc nhanh</Card.Title>
              <Form.Control
                placeholder="Tim theo ten benh nhan"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="med-card">
        <Card.Body className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Card.Title className="mb-0">Bang lich bac si theo tuan</Card.Title>
            <Badge bg="secondary">Tuan: {weekLabel}</Badge>
          </div>
          <div className="d-flex gap-2 mb-3">
            <Button size="sm" variant="outline-primary" onClick={() => setWeekOffset((prev) => prev - 1)}>
              Tuan truoc
            </Button>
            <Button size="sm" variant="outline-primary" onClick={() => setWeekOffset(0)}>
              Tuan hien tai
            </Button>
            <Button size="sm" variant="outline-primary" onClick={() => setWeekOffset((prev) => prev + 1)}>
              Tuan sau
            </Button>
          </div>

          <Table bordered responsive className="mb-0">
            <thead>
              <tr>
                <th>Ca</th>
                {weekDays.map((day) => (
                  <th key={day.toISOString()}>
                    {day.toLocaleDateString('vi-VN', { weekday: 'short' })} <br />
                    {day.toLocaleDateString('vi-VN')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHIFT_OPTIONS.map((shift) => (
                <tr key={shift.code}>
                  <td>
                    <strong>{shift.label}</strong>
                    <div className="small text-muted">{shift.time}</div>
                  </td>
                  {weekDays.map((day) => {
                    const schedule = doctorSchedules.find(
                      (item) => item.date === toDateKey(day) && item.time === shift.time
                    )
                    if (!schedule) {
                      return (
                        <td key={`${shift.code}-${day.toISOString()}`} className="text-muted">
                          Off
                        </td>
                      )
                    }
                    const isFull = Number(schedule.currentSlot) >= Number(schedule.maxSlot)
                    return (
                      <td key={`${shift.code}-${day.toISOString()}`}>
                        <div className="small">Phong: {schedule.room || '-'}</div>
                        <div className="small">
                          Slot: {schedule.currentSlot}/{schedule.maxSlot}
                        </div>
                        <Badge bg={isFull ? 'danger' : 'success'}>{isFull ? 'full' : 'available'}</Badge>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Card className="med-card mt-3">
        <Card.Body>
          <Card.Title>Lich benh nhan da dang ky</Card.Title>
          <Table striped hover responsive className="mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Benh nhan</th>
                <th>Ca kham</th>
                <th>Lien he</th>
                <th>Ho so</th>
              </tr>
            </thead>
            <tbody>
              {doctorAppointments.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>
                    <div>{item.patientName || item.patient?.fullName}</div>
                    <small className="text-muted">{item.patient?.email || item.email}</small>
                  </td>
                  <td>
                    <div>{item.schedule?.date || '-'}</div>
                    <small className="text-muted">{item.schedule?.time || '-'}</small>
                  </td>
                  <td>
                    <div>{item.phone || item.patient?.phone || '-'}</div>
                    <small className="text-muted">{item.address || item.patient?.address || '-'}</small>
                  </td>
                  <td>
                    <Button size="sm" onClick={() => setSelectedAppointment(item)}>
                      Xem ho so
                    </Button>
                  </td>
                </tr>
              ))}
              {doctorAppointments.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted">
                    Chua co lich dang ky nao cho bac si nay
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={Boolean(selectedAppointment)} onHide={() => setSelectedAppointment(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Ho so benh nhan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAppointment && (
            <>
              <p className="mb-2">
                <strong>Ten:</strong>{' '}
                {selectedAppointment.patientName || selectedAppointment.patient?.fullName}
              </p>
              <p className="mb-2">
                <strong>Email:</strong> {selectedAppointment.patient?.email || selectedAppointment.email || '-'}
              </p>
              <p className="mb-2">
                <strong>So dien thoai:</strong>{' '}
                {selectedAppointment.phone || selectedAppointment.patient?.phone || '-'}
              </p>
              <p className="mb-2">
                <strong>Dia chi:</strong>{' '}
                {selectedAppointment.address || selectedAppointment.patient?.address || '-'}
              </p>
              <p className="mb-2">
                <strong>Ca kham:</strong> {selectedAppointment.schedule?.date} -{' '}
                {selectedAppointment.schedule?.time}{' '}
                <Badge bg="info">{selectedAppointment.schedule?.room || 'N/A'}</Badge>
              </p>
              <p className="mb-0">
                <strong>Ghi chu:</strong> {selectedAppointment.note || 'Khong co'}
              </p>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default DoctorAppointmentsPage
