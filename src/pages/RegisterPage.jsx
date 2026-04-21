import { useState } from 'react'
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { endpoints } from '../api/config'

function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function onChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.fullName || !form.username || !form.password) {
      setError('Vui long nhap day du thong tin')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Mat khau xac nhan khong khop')
      return
    }

    const users = await api.get(endpoints.users)
    const existed = users.some(
      (item) => item.username.toLowerCase().trim() === form.username.toLowerCase().trim()
    )
    if (existed) {
      setError('Username da ton tai')
      return
    }

    await api.post(endpoints.users, {
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      password: form.password.trim(),
      role: 'patient',
    })

    setSuccess('Dang ky thanh cong. Chuyen sang trang login sau 1 giay...')
    setTimeout(() => navigate('/login'), 1000)
  }

  return (
    <div className="login-screen">
      <Container className="medilab-page">
        <Row className="justify-content-center align-items-center min-vh-100 g-0 g-lg-4">
          <Col lg={6} className="d-none d-lg-block">
            <Card className="med-card login-visual-card overflow-hidden">
              <img
                src="/custom-slider/slide-2.png"
                alt="Medical register"
                className="login-visual-image"
              />
              <Card.ImgOverlay className="login-visual-overlay d-flex flex-column justify-content-end">
                <h3 className="text-white mb-2">Tao tai khoan kham benh</h3>
                <p className="text-white-50 mb-0">
                  Dang ky nhanh de dat lich kham, theo doi thong tin va lich hen cua ban.
                </p>
              </Card.ImgOverlay>
            </Card>
          </Col>

          <Col md={9} lg={5}>
            <Card className="med-card login-form-card">
              <Card.Body className="p-4 p-lg-5">
                <Card.Title>Dang ky tai khoan</Card.Title>
                <Card.Text className="text-muted small">
                  Tao tai khoan patient de dat lich kham va theo doi lich hen.
                </Card.Text>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                <Form onSubmit={onSubmit}>
                  <Form.Group className="mb-2">
                    <Form.Label>Ho va ten</Form.Label>
                    <Form.Control
                      value={form.fullName}
                      onChange={(e) => onChange('fullName', e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                      value={form.username}
                      onChange={(e) => onChange('username', e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={form.password}
                      onChange={(e) => onChange('password', e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Confirm password</Form.Label>
                    <Form.Control
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => onChange('confirmPassword', e.target.value)}
                    />
                  </Form.Group>
                  <Button type="submit" className="w-100 mb-2">
                    Dang ky
                  </Button>
                  <div className="small text-muted text-center">
                    Da co tai khoan? <Link to="/login">Dang nhap</Link>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default RegisterPage
