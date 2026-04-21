import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Container, Form, Spinner, Table } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { api } from '../api/client'
import { endpoints } from '../api/config'
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_LABEL_VI,
  APPOINTMENT_STATUS_OPTIONS,
  appointmentStatusVariant,
} from '../constants/appointmentStatus'
import { applyAppointmentStatusChange } from '../utils/appointmentFlow'

function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [draftStatus, setDraftStatus] = useState({})

  const reload = useCallback(async () => {
    const data = await api.get(endpoints.appointments)
    setAppointments(data)
    const nextDraft = {}
    data.forEach((a) => {
      nextDraft[a.id] = a.status || APPOINTMENT_STATUS.CONFIRMED
    })
    setDraftStatus(nextDraft)
  }, [])

  useEffect(() => {
    async function loadData() {
      try {
        await reload()
      } catch {
        setError('Không tải được danh sách lịch hẹn')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [reload])

  const optionList = useMemo(
    () =>
      APPOINTMENT_STATUS_OPTIONS.map((value) => ({
        value,
        label: APPOINTMENT_STATUS_LABEL_VI[value] || value,
      })),
    []
  )

  async function onUpdateStatus(item) {
    const current = item.status || APPOINTMENT_STATUS.CONFIRMED
    const next = draftStatus[item.id]
    if (!next || next === current) {
      toast.info('Chọn trạng thái khác trước khi cập nhật')
      return
    }
    setBusyId(item.id)
    try {
      const raw = await api.get(`${endpoints.appointments}/${item.id}`)
      const res = await applyAppointmentStatusChange(raw, next)
      if (!res.ok) {
        toast.error(res.error || 'Không thể cập nhật')
        return
      }
      toast.success('Đã cập nhật trạng thái')
      await reload()
    } catch {
      toast.error('Thất bại, vui lòng thử lại')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Container className="py-2 medilab-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Quản lý lịch hẹn</h3>
        <Badge bg="secondary">{appointments.length} lịch hẹn</Badge>
      </div>
      <Alert variant="info" className="small py-2">
        Chọn trạng thái mới rồi bấm <strong>Cập nhật</strong>. <strong>Đã hủy</strong> và{' '}
        <strong>Đã khám xong</strong> → <strong>trả slot</strong>; <strong>Không đến</strong> vẫn{' '}
        <strong>giữ slot</strong>; khi chuyển từ đã hủy sang trạng thái đang giữ chỗ, hệ thống{' '}
        <strong>lấy slot</strong> nếu ca còn chỗ.
      </Alert>
      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      ) : (
        <Card className="med-card">
          <Card.Body>
            <Table striped bordered hover responsive className="mb-0 small">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Người dùng</th>
                  <th>Bác sĩ</th>
                  <th>Lịch</th>
                  <th>Tên bệnh nhân</th>
                  <th>Điện thoại</th>
                  <th>Hiện tại</th>
                  <th>Đổi trạng thái</th>
                  <th>Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((item) => {
                  const st = item.status || APPOINTMENT_STATUS.CONFIRMED
                  const selected = draftStatus[item.id] ?? st
                  const unchanged = selected === st
                  return (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.userId}</td>
                      <td>{item.doctorId}</td>
                      <td>{item.scheduleId}</td>
                      <td>{item.patientName}</td>
                      <td>{item.phone}</td>
                      <td>
                        <Badge bg={appointmentStatusVariant(st)}>
                          {APPOINTMENT_STATUS_LABEL_VI[st] || st}
                        </Badge>
                      </td>
                      <td style={{ minWidth: '11rem' }}>
                        <Form.Select
                          size="sm"
                          value={selected}
                          disabled={busyId === item.id}
                          onChange={(e) =>
                            setDraftStatus((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                        >
                          {optionList.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </Form.Select>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={busyId === item.id || unchanged}
                          onClick={() => onUpdateStatus(item)}
                        >
                          Cập nhật
                        </Button>
                      </td>
                    </tr>
                  )
                })}
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center text-muted">
                      Chưa có lịch hẹn nào
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  )
}

export default AdminAppointmentsPage
