import { useEffect, useState } from 'react'
import { Alert, Card, Table } from 'react-bootstrap'
import { api } from '../api/client'
import { endpoints } from '../api/config'
import { useAuthContext } from '../hooks/useAuthContext'

function PatientAppointmentsPage() {
  const { user } = useAuthContext()
  const [appointments, setAppointments] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.get(`${endpoints.appointments}?userId=${user.id}`)
        setAppointments(data)
      } catch {
        setError('Khong tai duoc lich hen')
      }
    }
    loadData()
  }, [user.id])

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Card className="med-card">
        <Card.Body>
          <Card.Title>Lich hen cua toi</Card.Title>
          <Table striped bordered hover responsive className="mb-0">
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
                    Khong co lich hen nao
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

export default PatientAppointmentsPage
