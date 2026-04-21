import { useEffect, useState } from 'react'
import { Alert, Badge, Card, Container, Spinner, Table } from 'react-bootstrap'
import { api } from '../api/client'
import { endpoints } from '../api/config'

function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.get(endpoints.appointments)
        setAppointments(data)
      } catch {
        setError('Khong tai duoc danh sach lich hen')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <Container className="py-2 medilab-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Quan ly lich hen</h3>
        <Badge bg="secondary">{appointments.length} lich hen</Badge>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      ) : (
        <Card className="med-card">
          <Card.Body>
            <Table striped bordered hover responsive className="mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Doctor</th>
                  <th>Schedule</th>
                  <th>Patient Name</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.userId}</td>
                    <td>{item.doctorId}</td>
                    <td>{item.scheduleId}</td>
                    <td>{item.patientName}</td>
                    <td>{item.phone}</td>
                  </tr>
                ))}
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted">
                      Chua co lich hen nao
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
