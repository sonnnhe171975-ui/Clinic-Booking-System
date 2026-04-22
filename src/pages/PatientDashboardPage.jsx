import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Card, Col, Row, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
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

function PatientDashboardPage() {
  const { user } = useAuthContext()
  const [appointments, setAppointments] = useState([])
  const [schedules, setSchedules] = useState([])
  const [doctors, setDoctors] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const [appts, sch, docList] = await Promise.all([
          api.get(`${endpoints.appointments}?userId=${user.id}`),
          api.get(endpoints.schedules),
          api.get(endpoints.doctors),
        ])
        setAppointments(appts)
        setSchedules(sch)
        setDoctors(docList)
      } catch {
        setError('Không tải được lịch hẹn của bạn')
      }
    }
    loadData()
  }, [user.id])

  const doctorById = useMemo(() => {
    const m = {}
    doctors.forEach((d) => {
      m[String(d.id)] = d
    })
    return m
  }, [doctors])

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
            statusLabel,
            user.fullName,
            item.phone,
            item.patientName,
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

  const activeCount = useMemo(
    () =>
      appointments.filter((a) => {
        const s = a.status || APPOINTMENT_STATUS.CONFIRMED
        return (
          s !== APPOINTMENT_STATUS.CANCELLED &&
          s !== APPOINTMENT_STATUS.COMPLETED &&
          s !== APPOINTMENT_STATUS.NO_SHOW
        )
      }).length,
    [appointments]
  )

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row className="g-3 mb-3">
        <Col md={4}>
          <Card className="med-card">
            <Card.Body>
              <Card.Title className="small text-uppercase text-muted">Vai trò</Card.Title>
              <h5 className="mb-0">
                <Badge bg="info">bệnh nhân</Badge>
              </h5>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="med-card">
            <Card.Body>
              <Card.Title className="small text-uppercase text-muted">Lịch đang hoạt động</Card.Title>
              <h4 className="mb-0">{activeCount}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="med-card">
            <Card.Body>
              <Card.Title className="small text-uppercase text-muted">Thao tác nhanh</Card.Title>
              <Link to="/patient/doctors">Đặt lịch khám mới</Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="med-card">
        <Card.Body>
          <Card.Title>Danh sách lịch hẹn gần đây</Card.Title>
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
          <Table striped hover responsive className="mb-0">
            <thead>
              <tr>
                <th>STT</th>
                <th>Bác sĩ</th>
                <th>Ngày / ca</th>
                <th>Lịch (ID)</th>
                <th>Trạng thái</th>
                <th>Bệnh nhân</th>
                <th>Điện thoại</th>
              </tr>
            </thead>
            <tbody>
              {tableView.pageRows.map((item, rowIdx) => {
                const st = item.status || APPOINTMENT_STATUS.CONFIRMED
                const sch = schedules.find((s) => String(s.id) === String(item.scheduleId))
                const doc = doctorById[String(item.doctorId)]
                return (
                  <tr key={item.id}>
                    <td>{tableView.rowStt(rowIdx)}</td>
                    <td>{doc?.name || item.doctorId}</td>
                    <td>
                      <div>{sch?.date || '—'}</div>
                      <small className="text-muted">{sch?.time || '—'}</small>
                    </td>
                    <td>{item.scheduleId}</td>
                    <td>
                      <Badge bg={appointmentStatusVariant(st)}>
                        {APPOINTMENT_STATUS_LABEL_VI[st] || st}
                      </Badge>
                    </td>
                    <td>{item.patientName || user.fullName}</td>
                    <td>{item.phone}</td>
                  </tr>
                )
              })}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted">
                    Bạn chưa có lịch hẹn nào
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
    </div>
  )
}

export default PatientDashboardPage
