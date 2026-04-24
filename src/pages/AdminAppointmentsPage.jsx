import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Container, Form, Spinner, Table } from 'react-bootstrap'
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
  APPOINTMENT_STATUS_OPTIONS,
  appointmentStatusVariant,
} from '../constants/appointmentStatus'
import { useClientTableView } from '../hooks/useClientTableView'
import {
  approveRescheduleRequest,
  getAppointmentById,
  getAllAppointments,
  rejectRescheduleRequest,
  updateAppointmentStatus,
} from '../services/appointmentService'
import { canAdminUpdateAppointmentStatus, canTransitionAppointmentStatus } from '../utils/permissions'
import { joinSearchParts, scheduleDateFromString } from '../utils/tableMeta'

function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [draftStatus, setDraftStatus] = useState({})

  const reload = useCallback(async () => {
    const [data, sch] = await Promise.all([getAllAppointments(), api.get(endpoints.schedules)])
    setAppointments(data)
    setSchedules(sch)
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

  const appointmentMeta = useMemo(
    () =>
      appointments.map((item) => {
        const sch = schedules.find((s) => String(s.id) === String(item.scheduleId))
        const st = item.status || APPOINTMENT_STATUS.CONFIRMED
        const statusLabel = APPOINTMENT_STATUS_LABEL_VI[st] || st
        return {
          search: joinSearchParts(
            item.id,
            item.userId,
            item.doctorId,
            item.scheduleId,
            item.patientName,
            item.phone,
            item.email,
            item.note,
            item.address,
            sch?.date,
            sch?.time,
            sch?.room,
            statusLabel
          ),
          date: scheduleDateFromString(sch?.date),
        }
      }),
    [appointments, schedules]
  )

  const tableView = useClientTableView(appointments, appointmentMeta)

  function hasPendingReschedule(item) {
    const v = item?.rescheduleToScheduleId
    return v != null && String(v).trim() !== ''
  }

  async function onApproveReschedule(item) {
    setBusyId(item.id)
    try {
      const raw = await getAppointmentById(item.id)
      const res = await approveRescheduleRequest(raw)
      if (!res.ok) {
        toast.error(res.error || 'Không thể duyệt đổi lịch')
        return
      }
      toast.success('Đã duyệt đổi lịch')
      await reload()
    } catch {
      toast.error('Thất bại, vui lòng thử lại')
    } finally {
      setBusyId(null)
    }
  }

  async function onRejectReschedule(item) {
    setBusyId(item.id)
    try {
      const raw = await getAppointmentById(item.id)
      const res = await rejectRescheduleRequest(raw)
      if (!res.ok) {
        toast.error(res.error || 'Không thể từ chối')
        return
      }
      toast.info('Đã từ chối yêu cầu đổi lịch')
      await reload()
    } catch {
      toast.error('Thất bại, vui lòng thử lại')
    } finally {
      setBusyId(null)
    }
  }

  async function onUpdateStatus(item) {
    if (!canAdminUpdateAppointmentStatus()) {
      toast.error('Bạn không có quyền cập nhật trạng thái lịch hẹn')
      return
    }
    const current = item.status || APPOINTMENT_STATUS.CONFIRMED
    const next = draftStatus[item.id]
    if (!next || next === current) {
      toast.info('Chọn trạng thái khác trước khi cập nhật')
      return
    }
    if (!canTransitionAppointmentStatus('admin', current, next)) {
      toast.error('Trạng thái chuyển không hợp lệ theo workflow')
      return
    }
    setBusyId(item.id)
    try {
      const raw = await getAppointmentById(item.id)
      const res = await updateAppointmentStatus(raw, next, 'admin')
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
        <strong>lấy slot</strong> nếu ca còn chỗ. Cột <strong>Yêu cầu đổi lịch</strong>: bệnh nhân
        gửi ca mới; <strong>Duyệt</strong> thực hiện đổi (đặt ca mới, hủy ca cũ), <strong>Từ chối</strong>{' '}
        xóa yêu cầu.
      </Alert>
      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      ) : (
        <Card className="med-card">
          <Card.Body>
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
            <Table striped bordered hover responsive className="mb-0 small">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã hẹn</th>
                  <th>Người dùng</th>
                  <th>Bác sĩ</th>
                  <th>Ngày / ca</th>
                  <th>Lịch (ID)</th>
                  <th>Tên bệnh nhân</th>
                  <th>Điện thoại</th>
                  <th>Hiện tại</th>
                  <th>Đổi trạng thái</th>
                  <th>Cập nhật</th>
                  <th>Yêu cầu đổi lịch</th>
                </tr>
              </thead>
              <tbody>
                {tableView.pageRows.map((item, rowIdx) => {
                  const st = item.status || APPOINTMENT_STATUS.CONFIRMED
                  const rowOptions = optionList.filter((opt) =>
                    canTransitionAppointmentStatus('admin', st, opt.value)
                  )
                  const selected = draftStatus[item.id] ?? st
                  const unchanged = selected === st
                  const sch = schedules.find((s) => String(s.id) === String(item.scheduleId))
                  const pendingSch = hasPendingReschedule(item)
                    ? schedules.find((s) => String(s.id) === String(item.rescheduleToScheduleId))
                    : null
                  return (
                    <tr key={item.id}>
                      <td>{tableView.rowStt(rowIdx)}</td>
                      <td>{item.id}</td>
                      <td>{item.userId}</td>
                      <td>{item.doctorId}</td>
                      <td>
                        <div>{sch?.date || '—'}</div>
                        <small className="text-muted">{sch?.time || '—'}</small>
                      </td>
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
                          value={rowOptions.some((opt) => opt.value === selected) ? selected : ''}
                          disabled={busyId === item.id}
                          onChange={(e) =>
                            setDraftStatus((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                        >
                          <option value="" disabled>
                            — Chọn trạng thái —
                          </option>
                          {rowOptions.map((opt) => (
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
                          disabled={busyId === item.id || unchanged || rowOptions.length === 0}
                          onClick={() => onUpdateStatus(item)}
                        >
                          Cập nhật
                        </Button>
                      </td>
                      <td style={{ minWidth: '8.5rem' }}>
                        {pendingSch ? (
                          <div className="d-flex flex-column gap-1">
                            <small className="text-muted">
                              → {pendingSch.date} {pendingSch.time}
                            </small>
                            <Button
                              size="sm"
                              variant="success"
                              disabled={busyId === item.id}
                              onClick={() => onApproveReschedule(item)}
                            >
                              Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              disabled={busyId === item.id}
                              onClick={() => onRejectReschedule(item)}
                            >
                              Từ chối
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan={12} className="text-center text-muted">
                      Chưa có lịch hẹn nào
                    </td>
                  </tr>
                )}
                {appointments.length > 0 && tableView.pageRows.length === 0 && (
                  <tr>
                    <td colSpan={12} className="text-center text-muted">
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
      )}
    </Container>
  )
}

export default AdminAppointmentsPage
