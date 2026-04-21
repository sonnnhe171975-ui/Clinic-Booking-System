import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Card, Col, Row, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { endpoints } from '../api/config'
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_LABEL_VI,
  appointmentStatusVariant,
} from '../constants/appointmentStatus'
import { useAuthContext } from '../hooks/useAuthContext'

function PatientDashboardPage() {
  const { user } = useAuthContext()
  const [appointments, setAppointments] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.get(`${endpoints.appointments}?userId=${user.id}`)
        setAppointments(data)
      } catch {
        setError('Không tải được lịch hẹn của bạn')
      }
    }
    loadData()
  }, [user.id])

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
          <Table striped hover responsive className="mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Bác sĩ (ID)</th>
                <th>Lịch (ID)</th>
                <th>Trạng thái</th>
                <th>Bệnh nhân</th>
                <th>Điện thoại</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((item) => {
                const st = item.status || APPOINTMENT_STATUS.CONFIRMED
                return (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.doctorId}</td>
                    <td>{item.scheduleId}</td>
                    <td>
                      <Badge bg={appointmentStatusVariant(st)}>
                        {APPOINTMENT_STATUS_LABEL_VI[st] || st}
                      </Badge>
                    </td>
                    <td>{user.fullName}</td>
                    <td>{item.phone}</td>
                  </tr>
                )
              })}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted">
                    Bạn chưa có lịch hẹn nào
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  )
}

export default PatientDashboardPage
