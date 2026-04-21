import { useState } from 'react'
import { Alert, Badge, Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import BackButton from '../components/BackButton'
import { useAuthContext } from '../hooks/useAuthContext'

function LoginPage() {
  const { login } = useAuthContext()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      const user = await login(username, password)
      if (user.role === 'admin') {
        navigate('/admin')
        return
      }
      if (user.role === 'patient') {
        navigate('/patient')
        return
      }
      if (user.role === 'doctor') {
        navigate('/doctor')
        return
      }
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="login-screen">
      <Container className="medilab-page">
        <Row className="justify-content-center align-items-center min-vh-100 g-0 g-lg-4">
          <Col lg={6} className="d-none d-lg-block">
            <Card className="med-card login-visual-card overflow-hidden">
              <img
                src="/medilab/MediLab-1.0.0/assets/img/about.jpg"
                alt="Hospital"
                className="login-visual-image"
              />
              <Card.ImgOverlay className="login-visual-overlay d-flex flex-column justify-content-end">
                <h3 className="text-white mb-2">Bệnh viện đặt lịch thông minh</h3>
                <p className="text-white-50 mb-0">
                  Quản lý lịch khám, đặt lịch nhanh và theo dõi trạng thái theo thời gian thực.
                </p>
              </Card.ImgOverlay>
            </Card>
          </Col>

          <Col md={9} lg={5}>
            <Card className="med-card login-form-card">
              <Card.Body className="p-4 p-lg-5">
                <BackButton fallback="/" label="Trang chủ" className="mb-3" forceFallback />
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Card.Title className="mb-0">Đăng nhập hệ thống</Card.Title>
                  <Badge bg="primary">Secure Auth</Badge>
                </div>
                <Card.Text className="text-muted small mb-4">
                  Admin: admin / 123456 — Bệnh nhân: user1 / 123456
                </Card.Text>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={onSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tên đăng nhập</Form.Label>
                    <Form.Control
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nhập tên đăng nhập"
                      autoComplete="username"
                    />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Label>Mật khẩu</Form.Label>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      autoComplete="current-password"
                    />
                  </Form.Group>
                  <Button type="submit" className="w-100 py-2 fw-semibold">
                    Đăng nhập
                  </Button>
                </Form>
                <div className="small text-muted text-center mt-2">
                  Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default LoginPage
