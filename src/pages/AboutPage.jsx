import { Card, Col, Container, Row } from 'react-bootstrap'

function AboutPage() {
  return (
    <Container className="medilab-page py-2">
      <div className="medilab-hero">
        <h2 className="mb-2">About Clinic Booking</h2>
        <p className="mb-0">
          He thong dat lich giup benh nhan chu dong chon bac si, thoi gian va theo doi lich hen.
        </p>
      </div>

      <Row className="g-3">
        <Col md={6}>
          <Card className="med-card h-100">
            <Card.Body>
              <Card.Title>Thong tin don vi</Card.Title>
              <Card.Text className="text-muted">
                Clinic Booking System duoc xay dung cho bai tap FER202 voi muc tieu so hoa quy
                trinh dat lich kham benh.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="med-card h-100">
            <Card.Body>
              <Card.Title>Dia chi lien he</Card.Title>
              <Card.Text className="mb-1">123 Nguyen Van Linh, Hai Chau, Da Nang</Card.Text>
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
