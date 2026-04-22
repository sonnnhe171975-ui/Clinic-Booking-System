import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Form, Modal, Table } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { api } from '../api/client'
import { endpoints } from '../api/config'
import {
  ClientTablePaginationFooter,
  ClientTableToolbar,
} from '../components/ClientTableControls'
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_LABEL_VI,
  appointmentStatusVariant,
} from '../constants/appointmentStatus'
import { useAuthContext } from '../hooks/useAuthContext'
import { useClientTableView } from '../hooks/useClientTableView'
import { joinSearchParts, scheduleDateFromString } from '../utils/tableMeta'
import {
  cancelAppointment,
  changeAppointmentSchedule,
  getAppointmentById,
} from '../services/appointmentService'
import { canPatientManageAppointmentStatus } from '../utils/permissions'

function PatientAppointmentsPage() {
  const { user } = useAuthContext()
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [schedules, setSchedules] = useState([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [rescheduleTarget, setRescheduleTarget] = useState(null)
  const [newScheduleId, setNewScheduleId] = useState('')

  const reload = useCallback(async () => {
    const [appts, docList, schList] = await Promise.all([
      api.get(`${endpoints.appointments}?userId=${user.id}`),
      api.get(endpoints.doctors),
      api.get(endpoints.schedules),
    ])
    setAppointments(appts)
    setDoctors(docList)
    setSchedules(schList)
  }, [user.id])

  useEffect(() => {
    async function loadData() {
      try {
        await reload()
      } catch {
        setError('Không tải được lịch hẹn')
      }
    }
    loadData()
  }, [reload])

  const doctorById = useMemo(() => {
    const m = {}
    doctors.forEach((d) => {
      m[String(d.id)] = d
    })
    return m
  }, [doctors])

  const rescheduleOptions = useMemo(() => {
    if (!rescheduleTarget) return []
    return schedules.filter((s) => {
      if (String(s.doctorId) !== String(rescheduleTarget.doctorId)) return false
      if (String(s.id) === String(rescheduleTarget.scheduleId)) return false
      return Number(s.currentSlot) < Number(s.maxSlot)
    })
  }, [schedules, rescheduleTarget])

  const appointmentMeta = useMemo(
    () =>
      appointments.map((item) => {
        const sch = schedules.find((s) => String(s.id) === String(item.scheduleId))
        const doc = doctorById[String(item.doctorId)]
        const st = item.status || APPOINTMENT_STATUS.CONFIRMED
        const statusLabel = APPOINTMENT_STATUS_LABEL_VI[st] || st
        return {
          search: joinSearchParts(
            item.id,
            item.doctorId,
            doc?.name,
            item.scheduleId,
            sch?.date,
            sch?.time,
            sch?.room,
            statusLabel,
            item.patientName,
            user.fullName,
            item.phone,
            item.email,
            item.note,
            item.address
          ),
          date: scheduleDateFromString(sch?.date),
        }
      }),
    [appointments, schedules, doctorById, user.fullName]
  )

  const tableView = useClientTableView(appointments, appointmentMeta)

  async function onCancel(item) {
    setBusyId(item.id)
    try {
      const raw = await getAppointmentById(item.id)
      const res = await cancelAppointment(raw)
      if (!res.ok) {
        toast.error(res.error || 'Không thể hủy')
        return
      }
      toast.success('Đã hủy lịch và trả slot')
      await reload()
    } catch {
      toast.error('Hủy lịch thất bại')
    } finally {
      setBusyId(null)
    }
  }

  async function onConfirmReschedule() {
    if (!rescheduleTarget || !newScheduleId) return
    setBusyId(rescheduleTarget.id)
    try {
      const raw = await getAppointmentById(rescheduleTarget.id)
      const res = await changeAppointmentSchedule(raw, Number(newScheduleId), {
        userId: user.id,
        doctorId: raw.doctorId,
        patientName: raw.patientName || user.fullName,
        phone: raw.phone,
        email: raw.email || user.email || '',
        address: raw.address || user.address || '',
        note: raw.note || '',
      })
      if (!res.ok) {
        toast.error(res.error || 'Đổi lịch thất bại')
        return
      }
      toast.success('Đã đổi lịch thành công')
      setRescheduleTarget(null)
      setNewScheduleId('')
      await reload()
    } catch {
      toast.error('Đổi lịch thất bại')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Card className="med-card">
        <Card.Body>
          <Card.Title>Lịch hẹn của tôi</Card.Title>
          <ClientTableToolbar
            search={tableView.search}
            onSearchChange={tableView.setSearch}
            dateFrom={tableView.dateFrom}
            onDateFromChange={tableView.setDateFrom}
            dateTo={tableView.dateTo}
            onDateToChange={tableView.setDateTo}
            dateSortDir={tableView.dateSortDir}
            onToggleDateSort={tableView.toggleDateSort}
          />
          <Table striped bordered hover responsive className="mb-0">
            <thead>
              <tr>
                <th>STT</th>
                <th>Bác sĩ</th>
                <th>Ngày / ca</th>
                <th>Trạng thái</th>
                <th>Bệnh nhân</th>
                <th>Điện thoại</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {tableView.pageRows.map((item, rowIdx) => {
                const sch = schedules.find((s) => String(s.id) === String(item.scheduleId))
                const doc = doctorById[String(item.doctorId)]
                const st = item.status || APPOINTMENT_STATUS.CONFIRMED
                const canChange = canPatientManageAppointmentStatus(st)
                return (
                  <tr key={item.id}>
                    <td>{tableView.rowStt(rowIdx)}</td>
                    <td>{doc?.name || item.doctorId}</td>
                    <td>
                      <div>{sch?.date || '-'}</div>
                      <small className="text-muted">{sch?.time || '-'}</small>
                    </td>
                    <td>
                      <Badge bg={appointmentStatusVariant(st)}>
                        {APPOINTMENT_STATUS_LABEL_VI[st] || st}
                      </Badge>
                    </td>
                    <td>{item.patientName || user.fullName}</td>
                    <td>{item.phone}</td>
                    <td>
                      {canChange ? (
                        <div className="d-flex flex-column gap-1">
                          <Button
                            size="sm"
                            variant="outline-danger"
                            disabled={busyId === item.id}
                            onClick={() => onCancel(item)}
                          >
                            Hủy lịch
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            disabled={busyId === item.id}
                            onClick={() => {
                              setRescheduleTarget(item)
                              setNewScheduleId('')
                            }}
                          >
                            Đổi lịch
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted">
                    Không có lịch hẹn nào
                  </td>
                </tr>
              )}
              {appointments.length > 0 && tableView.pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted">
                    Không có dòng nào khớp bộ lọc
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
          <ClientTablePaginationFooter
            page={tableView.page}
            totalPages={tableView.totalPages}
            onPageChange={tableView.setPage}
            totalFiltered={tableView.totalFiltered}
            pageSize={tableView.pageSize}
          />
        </Card.Body>
      </Card>

      <Modal show={Boolean(rescheduleTarget)} onHide={() => setRescheduleTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Đổi lịch hẹn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {rescheduleTarget && (
            <>
              <p className="small text-muted">
                Chọn ca trống cùng bác sĩ. Hệ thống giữ ca mới trước, sau đó hủy ca cũ (có hoàn tác
                nếu lỗi).
              </p>
              <Form.Group>
                <Form.Label>Ca mới</Form.Label>
                <Form.Select
                  value={newScheduleId}
                  onChange={(e) => setNewScheduleId(e.target.value)}
                >
                  <option value="">— Chọn lịch —</option>
                  {rescheduleOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.date} — {s.time} (slot {s.currentSlot}/{s.maxSlot})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              {rescheduleOptions.length === 0 && (
                <Alert variant="warning" className="mt-2 mb-0 small">
                  Hiện không có ca trống cùng bác sĩ để đổi.
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setRescheduleTarget(null)}>
            Đóng
          </Button>
          <Button
            variant="primary"
            disabled={!newScheduleId || busyId || rescheduleOptions.length === 0}
            onClick={onConfirmReschedule}
          >
            Xác nhận đổi lịch
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default PatientAppointmentsPage
