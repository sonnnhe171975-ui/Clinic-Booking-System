import { Card, Col, Container, Row } from 'react-bootstrap'

function AboutPage() {
  return (
    <Container className="medilab-page py-2">
      <div className="medilab-hero">
        <h2 className="mb-2">Giới thiệu Clinic Booking</h2>
        <p className="mb-0">
          Hệ thống đặt lịch giúp bệnh nhân chủ động chọn bác sĩ, thời gian và theo dõi lịch hẹn.
        </p>
      </div>

      <Row className="g-3">
        <Col md={6}>
          <Card className="med-card h-100">
            <Card.Body>
              <Card.Title>Thông tin đơn vị</Card.Title>
              <Card.Text className="text-muted">
                Clinic Booking System được xây dựng cho bài tập FER202 với mục tiêu số hóa quy
                trình đặt lịch khám bệnh.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="med-card h-100">
            <Card.Body>
              <Card.Title>Địa chỉ liên hệ</Card.Title>
              <Card.Text className="mb-1">123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng</Card.Text>
              <Card.Text className="mb-1">Hotline: 1900 565656</Card.Text>
              <Card.Text className="mb-0">Email: support@clinicbooking.vn</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default AboutPage
