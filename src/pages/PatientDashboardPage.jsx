import { useEffect, useState } from 'react'
import { Alert, Badge, Card, Col, Row, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { endpoints } from '../api/config'
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
        setError('Khong tai duoc lich hen cua ban')
      }
    }
    loadData()
  }, [user.id])

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row className="g-3 mb-3">
        <Col md={4}>
          <Card className="med-card">
            <Card.Body>
              <Card.Title className="small text-uppercase text-muted">Vai tro</Card.Title>
              <h5 className="mb-0">
                <Badge bg="info">patient</Badge>
              </h5>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="med-card">
            <Card.Body>
              <Card.Title className="small text-uppercase text-muted">Tong lich hen</Card.Title>
              <h4 className="mb-0">{appointments.length}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="med-card">
            <Card.Body>
              <Card.Title className="small text-uppercase text-muted">Thao tac nhanh</Card.Title>
              <Link to="/doctors">Dat lich kham moi</Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="med-card">
        <Card.Body>
          <Card.Title>Danh sach lich hen gan day</Card.Title>
          <Table striped hover responsive className="mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Doctor ID</th>
                <th>Schedule ID</th>
                <th>Patient</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.doctorId}</td>
                  <td>{item.scheduleId}</td>
                  <td>{user.fullName}</td>
                  <td>{item.phone}</td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted">
                    Ban chua co lich hen nao
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
