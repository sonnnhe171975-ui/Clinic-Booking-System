import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Badge, Button, ButtonGroup, Card, Col, Modal, Row, Table } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { api } from '../api/client'
import { endpoints } from '../api/config'
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_LABEL_VI,
  appointmentStatusVariant,
  isTerminalAppointmentStatus,
} from '../constants/appointmentStatus'
import { useAuthContext } from '../hooks/useAuthContext'
import { applyAppointmentStatusChange, cancelAppointmentAndReleaseSlot } from '../utils/appointmentFlow'

const SHIFT_OPTIONS = [
  { code: 'ca1', label: 'Ca 1', time: '07:00-10:00' },
  { code: 'ca2', label: 'Ca 2', time: '10:00-12:20' },
  { code: 'ca3', label: 'Ca 3', time: '12:50-15:00' },
  { code: 'ca4', label: 'Ca 4', time: '15:30-17:40' },
]

function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function computeAge(dateOfBirth) {
  if (!dateOfBirth) return null
  const born = new Date(dateOfBirth)
  if (Number.isNaN(born.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - born.getFullYear()
  const m = today.getMonth() - born.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age -= 1
  return age
}

function DoctorAppointmentsPage() {
  const { user } = useAuthContext()
  const [appointments, setAppointments] = useState([])
  const [userMap, setUserMap] = useState({})
  const [schedules, setSchedules] = useState([])
  const [doctors, setDoctors] = useState([])
  const [error, setError] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [busyAppointmentId, setBusyAppointmentId] = useState(null)
  const weeklyScheduleRef = useRef(null)
  const knownPendingIdsRef = useRef(new Set())
  const initializedNotificationRef = useRef(false)

  const reloadCore = useCallback(async () => {
    const [appointmentData, scheduleData, doctorData] = await Promise.all([
      api.get(endpoints.appointments),
      api.get(endpoints.schedules),
      api.get(endpoints.doctors),
    ])
    setAppointments(appointmentData)
    setSchedules(scheduleData)
    setDoctors(doctorData)
  }, [])

  useEffect(() => {
    async function loadData() {
      try {
        await reloadCore()
      } catch {
        setError('Không tải được dữ liệu lịch hẹn')
      }
    }
    loadData()
  }, [reloadCore])

  useEffect(() => {
    const timer = setInterval(() => {
      reloadCore().catch(() => {
        /* ignore polling error */
      })
    }, 8000)
    return () => clearInterval(timer)
  }, [reloadCore])

  const doctorProfile = useMemo(() => {
    const byDoctorId = doctors.find((item) => String(item.id) === String(user?.doctorId))
    if (byDoctorId) return byDoctorId
    return doctors.find((item) => item.email === user?.email) || null
  }, [doctors, user])

  const patientUserIdsKey = useMemo(() => {
    const set = new Set()
    appointments
      .filter((item) => String(item.doctorId) === String(doctorProfile?.id))
      .forEach((a) => set.add(String(a.userId)))
    return [...set].sort().join('|')
  }, [appointments, doctorProfile])

  useEffect(() => {
    let cancelled = false
    async function loadUsers() {
      const ids = patientUserIdsKey ? patientUserIdsKey.split('|').filter(Boolean) : []
      if (!ids.length) {
        if (!cancelled) setUserMap({})
        return
      }
      try {
        const allUsers = await api.get(endpoints.users)
        if (cancelled) return
        const want = new Set(ids)
        const m = {}
        allUsers.forEach((u) => {
          const id = String(u.id)
          if (want.has(id)) m[id] = u
        })
        setUserMap(m)
      } catch {
        if (!cancelled) setUserMap({})
      }
    }
    loadUsers()
    return () => {
      cancelled = true
    }
  }, [patientUserIdsKey])

  const doctorAppointments = useMemo(() => {
    return appointments
      .filter((item) => String(item.doctorId) === String(doctorProfile?.id))
      .map((item) => {
        const schedule = schedules.find((s) => String(s.id) === String(item.scheduleId))
        const patient = userMap[String(item.userId)] || null
        return { ...item, schedule, patient }
      })
  }, [appointments, schedules, userMap, doctorProfile])

  const activeAppointmentCount = useMemo(
    () =>
      doctorAppointments.filter((a) => {
        const s = a.status || APPOINTMENT_STATUS.CONFIRMED
        return (
          s !== APPOINTMENT_STATUS.CANCELLED &&
          s !== APPOINTMENT_STATUS.COMPLETED &&
          s !== APPOINTMENT_STATUS.NO_SHOW
        )
      }).length,
    [doctorAppointments]
  )

  const pendingNotifications = useMemo(() => {
    return doctorAppointments
      .filter((item) => (item.status || APPOINTMENT_STATUS.CONFIRMED) === APPOINTMENT_STATUS.PENDING)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 6)
  }, [doctorAppointments])

  useEffect(() => {
    const nextIds = new Set(pendingNotifications.map((item) => String(item.id)))
    if (!initializedNotificationRef.current) {
      knownPendingIdsRef.current = nextIds
      initializedNotificationRef.current = true
      return
    }
    pendingNotifications.forEach((item) => {
      const id = String(item.id)
      if (knownPendingIdsRef.current.has(id)) return
      const patientName = item.patientName || item.patient?.fullName || 'Bệnh nhân'
      toast.info(`${patientName} vừa đăng ký lịch mới, cần xác nhận`, { autoClose: 2500 })
    })
    knownPendingIdsRef.current = nextIds
  }, [pendingNotifications])

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

  const bookingsInSelectedSlot = useMemo(() => {
    if (!selectedSlot?.schedule) return []
    const list = doctorAppointments.filter(
      (a) => String(a.scheduleId) === String(selectedSlot.schedule.id)
    )
    return [...list].sort((a, b) => {
      const ca = a.status === APPOINTMENT_STATUS.CANCELLED ? 1 : 0
      const cb = b.status === APPOINTMENT_STATUS.CANCELLED ? 1 : 0
      return ca - cb
    })
  }, [selectedSlot, doctorAppointments])

  async function runDoctorAction(appointmentId, fn) {
    setBusyAppointmentId(appointmentId)
    try {
      const raw = await api.get(`${endpoints.appointments}/${appointmentId}`)
      const res = await fn(raw)
      if (res && typeof res === 'object' && res.ok === false) {
        toast.error(res.error || 'Thất bại, vui lòng thử lại')
        return
      }
      await reloadCore()
      toast.success('Đã cập nhật lịch hẹn')
    } catch {
      toast.error('Thất bại, vui lòng thử lại')
    } finally {
      setBusyAppointmentId(null)
    }
  }

  function renderDoctorActions(item) {
    const st = item.status || APPOINTMENT_STATUS.CONFIRMED
    const busy = busyAppointmentId === item.id

    if (st === APPOINTMENT_STATUS.CANCELLED) {
      return <span className="text-muted small">Đã hủy</span>
    }
    if (isTerminalAppointmentStatus(st)) {
      return <span className="text-muted small">Hoàn tất</span>
    }

    return (
      <ButtonGroup size="sm" vertical className="w-100">
        {st === APPOINTMENT_STATUS.PENDING && (
          <>
            <Button
              variant="primary"
              disabled={busy}
              onClick={() =>
                runDoctorAction(item.id, (raw) =>
                  applyAppointmentStatusChange(raw, APPOINTMENT_STATUS.CONFIRMED)
                )
              }
            >
              Xác nhận lịch
            </Button>
            <Button
              variant="outline-danger"
              disabled={busy}
              onClick={() =>
                runDoctorAction(item.id, (raw) => cancelAppointmentAndReleaseSlot(raw))
              }
            >
              Từ chối (trả slot)
            </Button>
          </>
        )}
        {st === APPOINTMENT_STATUS.CONFIRMED && (
          <>
            <Button
              variant="info"
              disabled={busy}
              onClick={() =>
                runDoctorAction(item.id, (raw) =>
                  applyAppointmentStatusChange(raw, APPOINTMENT_STATUS.CHECKED_IN)
                )
              }
            >
              Bệnh nhân đã đến
            </Button>
            <Button
              variant="outline-warning"
              disabled={busy}
              onClick={() =>
                runDoctorAction(item.id, (raw) =>
                  applyAppointmentStatusChange(raw, APPOINTMENT_STATUS.NO_SHOW)
                )
              }
            >
              Không đến (giữ slot)
            </Button>
            <Button
              variant="outline-danger"
              disabled={busy}
              onClick={() =>
                runDoctorAction(item.id, (raw) => cancelAppointmentAndReleaseSlot(raw))
              }
            >
              Hủy lịch (trả slot)
            </Button>
          </>
        )}
        {st === APPOINTMENT_STATUS.CHECKED_IN && (
          <Button
            variant="success"
            disabled={busy}
            onClick={() =>
              runDoctorAction(item.id, (raw) =>
                applyAppointmentStatusChange(raw, APPOINTMENT_STATUS.COMPLETED)
              )
            }
          >
            Hoàn thành khám
          </Button>
        )}
      </ButtonGroup>
    )
  }

  function onOpenPendingNotification(item) {
    const schedule = item.schedule || schedules.find((s) => String(s.id) === String(item.scheduleId))
    if (!schedule) {
      toast.error('Không tìm thấy ca làm việc để mở')
      return
    }
    weeklyScheduleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const shift =
      SHIFT_OPTIONS.find((option) => option.time === schedule.time) || {
        code: 'custom',
        label: 'Ca',
        time: schedule.time,
      }
    setSelectedSlot({ schedule, shift })
  }

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row className="g-3 mb-3">
        <Col md={6}>
          <Card className="med-card">
            <Card.Body>
              <Card.Title className="small text-uppercase text-muted">Bác sĩ</Card.Title>
              <h5 className="mb-1">{doctorProfile?.name || user?.fullName}</h5>
              <small className="text-muted">{doctorProfile?.degree || 'Tài khoản bác sĩ'}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="med-card">
            <Card.Body>
              <Card.Title className="small text-uppercase text-muted">
                Lịch hẹn đang hoạt động
              </Card.Title>
              <h4 className="mb-0">{activeAppointmentCount}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12}>
          <Card className="med-card border-warning-subtle">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Card.Title className="mb-0">Thong bao lich moi dang ky</Card.Title>
                <div className="d-flex align-items-center gap-2">
                  <Badge bg={pendingNotifications.length ? 'warning' : 'secondary'} text="dark">
                    {pendingNotifications.length}
                  </Badge>
                  <Button size="sm" variant="outline-secondary" onClick={reloadCore}>
                    Làm mới
                  </Button>
                </div>
              </div>
              {pendingNotifications.length === 0 ? (
                <p className="small text-muted mb-0">Hien khong co lich moi cho ban xac nhan.</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {pendingNotifications.map((item) => {
                    const p = item.patient
                    const patientName = item.patientName || p?.fullName || 'Benh nhan'
                    const slotText = item.schedule
                      ? `${item.schedule.date} (${item.schedule.time})`
                      : `Lich #${item.scheduleId}`
                    return (
                      <div
                        key={item.id}
                        className="d-flex flex-wrap align-items-center justify-content-between gap-2 border rounded px-2 py-2"
                      >
                        <div className="small">
                          <strong>{patientName}</strong> vua dang ky kham - {slotText}
                        </div>
                        <Button size="sm" variant="outline-primary" onClick={() => onOpenPendingNotification(item)}>
                          Xem va xac nhan
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="med-card" ref={weeklyScheduleRef}>
        <Card.Body className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Card.Title className="mb-0">Bảng lịch bác sĩ theo tuần</Card.Title>
            <Badge bg="secondary">Tuần: {weekLabel}</Badge>
          </div>
          <p className="small text-muted mb-3">
            Bấm vào ô ca có lịch để xem bệnh nhân, trạng thái lịch hẹn và cập nhật tiến trình khám.
          </p>
          <div className="d-flex gap-2 mb-3">
            <Button size="sm" variant="outline-primary" onClick={() => setWeekOffset((prev) => prev - 1)}>
              Tuần trước
            </Button>
            <Button size="sm" variant="outline-primary" onClick={() => setWeekOffset(0)}>
              Tuần hiện tại
            </Button>
            <Button size="sm" variant="outline-primary" onClick={() => setWeekOffset((prev) => prev + 1)}>
              Tuần sau
            </Button>
          </div>

          <Table bordered responsive className="mb-0 doctor-weekly-schedule">
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
                        <td key={`${shift.code}-${day.toISOString()}`} className="text-muted align-middle">
                          Nghỉ
                        </td>
                      )
                    }
                    const isFull = Number(schedule.currentSlot) >= Number(schedule.maxSlot)
                    return (
                      <td
                        key={`${shift.code}-${day.toISOString()}`}
                        role="button"
                        tabIndex={0}
                        className="doctor-schedule-cell align-middle"
                        onClick={() => setSelectedSlot({ schedule, shift })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedSlot({ schedule, shift })
                          }
                        }}
                      >
                        <div className="small">Phòng: {schedule.room || '-'}</div>
                        <div className="small">
                          Slot: {schedule.currentSlot}/{schedule.maxSlot}
                        </div>
                        <Badge bg={isFull ? 'danger' : 'success'}>
                          {isFull ? 'đầy' : 'còn chỗ'}
                        </Badge>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal
        show={Boolean(selectedSlot)}
        onHide={() => setSelectedSlot(null)}
        centered
        size="lg"
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết ca làm việc</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSlot && (
            <>
              <div className="mb-4 p-3 bg-light rounded">
                <div className="fw-semibold mb-2">
                  {selectedSlot.shift.label} ({selectedSlot.shift.time})
                </div>
                <div className="small">
                  <div>
                    <strong>Ngày:</strong> {selectedSlot.schedule.date}
                  </div>
                  <div>
                    <strong>Phòng:</strong> {selectedSlot.schedule.room || '-'}
                  </div>
                  <div>
                    <strong>Slot:</strong> {selectedSlot.schedule.currentSlot}/{selectedSlot.schedule.maxSlot}{' '}
                    <Badge bg={selectedSlot.schedule.status === 'full' ? 'danger' : 'secondary'}>
                      {selectedSlot.schedule.status === 'full' ? 'đầy' : 'còn chỗ'}
                    </Badge>
                  </div>
                  {selectedSlot.schedule.fee != null && (
                    <div>
                      <strong>Phí khám:</strong>{' '}
                      {Number(selectedSlot.schedule.fee).toLocaleString('vi-VN')} đ
                    </div>
                  )}
                </div>
              </div>

              <h6 className="mb-3">Bệnh nhân trong ca</h6>
              {bookingsInSelectedSlot.length === 0 ? (
                <p className="text-muted mb-0">Chưa có bệnh nhân đặt lịch trong ca này.</p>
              ) : (
                bookingsInSelectedSlot.map((item) => {
                  const p = item.patient
                  const name = item.patientName || p?.fullName || '-'
                  const email = p?.email || item.email || '-'
                  const phone = item.phone || p?.phone || '-'
                  const address = item.address || p?.address || '-'
                  const gender = p?.gender || '-'
                  const underlying = p?.underlyingConditions
                  const history = p?.medicalHistory
                  const age =
                    p?.age != null ? p.age : computeAge(p?.dateOfBirth)
                  const st = item.status || APPOINTMENT_STATUS.CONFIRMED
                  return (
                    <Card key={item.id} className="mb-3 border">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                          <div>
                            <strong className="fs-6">{name}</strong>
                            {age != null && (
                              <Badge bg="light" text="dark" className="ms-2">
                                {age} tuổi
                              </Badge>
                            )}
                          </div>
                          <div className="d-flex flex-column align-items-end gap-1">
                            <Badge bg="info">Hẹn #{item.id}</Badge>
                            <Badge bg={appointmentStatusVariant(st)}>
                              {APPOINTMENT_STATUS_LABEL_VI[st] || st}
                            </Badge>
                          </div>
                        </div>
                        <Row className="g-2 small">
                          <Col sm={6}>
                            <strong>Email:</strong> {email}
                          </Col>
                          <Col sm={6}>
                            <strong>Điện thoại:</strong> {phone}
                          </Col>
                          <Col sm={6}>
                            <strong>Giới tính:</strong> {gender}
                          </Col>
                          <Col sm={12}>
                            <strong>Địa chỉ:</strong> {address}
                          </Col>
                          <Col sm={12}>
                            <strong>Bệnh nền:</strong>{' '}
                            {underlying || <span className="text-muted">Chưa cập nhật</span>}
                          </Col>
                          <Col sm={12}>
                            <strong>Lịch sử khám:</strong>{' '}
                            {history || <span className="text-muted">Chưa cập nhật</span>}
                          </Col>
                          <Col sm={12}>
                            <strong>Ghi chú đặt hẹn:</strong> {item.note || '-'}
                          </Col>
                          <Col sm={12} className="pt-2 border-top">
                            {renderDoctorActions(item)}
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  )
                })
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default DoctorAppointmentsPage
