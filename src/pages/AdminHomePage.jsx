import { Badge, Button, Card, Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const cards = [
  {
    to: '/admin/specialties',
    title: 'Chuyên khoa',
    description: 'Danh mục chuyên khoa phòng khám: thêm, chỉnh sửa và xóa khi cần.',
  },
  {
    to: '/admin/doctors',
    title: 'Bác sĩ',
    description: 'Hồ sơ bác sĩ, chuyên khoa và kinh nghiệm làm việc.',
  },
  {
    to: '/admin/schedules',
    title: 'Lịch khám',
    description: 'Ca làm việc, phòng khám và số lượt đặt theo từng khung giờ.',
  },
  {
    to: '/admin/users',
    title: 'Người dùng',
    description: 'Tài khoản bệnh nhân, bác sĩ và quản trị viên.',
  },
  {
    to: '/admin/appointments',
    title: 'Danh sách lịch hẹn',
    description: 'Theo dõi và cập nhật trạng thái các lịch đã đặt.',
  },
]

function AdminHomePage() {
  return (
    <Container className="py-2 medilab-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Trang quản trị</h3>
        <Badge bg="dark">Admin</Badge>
      </div>
      <div className="admin-module-grid">
        {cards.map((item) => (
          <Card className="med-card admin-dash-card h-100" key={item.to}>
            <Card.Body className="d-flex flex-column">
              <Card.Title className="h5 mb-3">{item.title}</Card.Title>
              <Card.Text className="text-muted flex-grow-1 small lh-base">{item.description}</Card.Text>
              <Button as={Link} to={item.to} variant="primary" className="mt-3 align-self-start">
                Vào trang quản lý
              </Button>
            </Card.Body>
          </Card>
        ))}
      </div>
    </Container>
  )
}

export default AdminHomePage
