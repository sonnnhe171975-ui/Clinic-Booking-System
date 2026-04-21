import { useState } from 'react'
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { endpoints } from '../api/config'

function normalizePhoneDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}

function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function onChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.fullName?.trim() || !form.username?.trim() || !form.password) {
      setError('Vui lòng nhập đầy đủ họ tên, tên đăng nhập và mật khẩu')
      return
    }
    if (!form.email?.trim() || !form.phone?.trim()) {
      setError('Vui lòng nhập email và số điện thoại')
      return
    }
    if (!isValidEmail(form.email)) {
      setError('Email không hợp lệ')
      return
    }
    const phoneDigits = normalizePhoneDigits(form.phone)
    if (phoneDigits.length < 9 || phoneDigits.length > 11) {
      setError('Số điện thoại không hợp lệ (9–11 chữ số)')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    setSubmitting(true)
    try {
      const users = await api.get(endpoints.users)
      const uname = form.username.toLowerCase().trim()
      const existed = users.some(
        (item) => String(item.username || '').toLowerCase().trim() === uname
      )
      if (existed) {
        setError('Tên đăng nhập đã tồn tại')
        return
      }

      const emailTaken = users.some(
        (item) => String(item.email || '').toLowerCase().trim() === form.email.toLowerCase().trim()
      )
      if (emailTaken) {
        setError('Email này đã được dùng cho tài khoản khác')
        return
      }

      await api.post(endpoints.users, {
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        password: form.password.trim(),
        role: 'patient',
        email: form.email.trim(),
        phone: phoneDigits,
        address: '',
      })

      setSuccess('Đăng ký thành công. Chuyển sang trang đăng nhập sau 1 giây…')
      setTimeout(() => navigate('/login'), 1000)
    } catch {
      setError('Không thể đăng ký. Hãy chạy API (npm run server) và thử lại.')
    } finally {
      setSubmitting(false)
    }
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
                <h3 className="text-white mb-2">Tạo tài khoản khám bệnh</h3>
                <p className="text-white-50 mb-0">
                  Đăng ký nhanh để đặt lịch khám, theo dõi thông tin và lịch hẹn của bạn.
                </p>
              </Card.ImgOverlay>
            </Card>
          </Col>

          <Col md={9} lg={5}>
            <Card className="med-card login-form-card">
              <Card.Body className="p-4 p-lg-5">
                <Card.Title>Đăng ký tài khoản</Card.Title>
                <Card.Text className="text-muted small">
                  Tạo tài khoản bệnh nhân (bắt buộc email và số điện thoại liên hệ).
                </Card.Text>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                <Form onSubmit={onSubmit}>
                  <Form.Group className="mb-2">
                    <Form.Label>Họ và tên</Form.Label>
                    <Form.Control
                      value={form.fullName}
                      onChange={(e) => onChange('fullName', e.target.value)}
                      autoComplete="name"
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Tên đăng nhập</Form.Label>
                    <Form.Control
                      value={form.username}
                      onChange={(e) => onChange('username', e.target.value)}
                      autoComplete="username"
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={form.email}
                      onChange={(e) => onChange('email', e.target.value)}
                      autoComplete="email"
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Số điện thoại</Form.Label>
                    <Form.Control
                      value={form.phone}
                      onChange={(e) => onChange('phone', e.target.value)}
                      placeholder="Ví dụ: 0912345678"
                      autoComplete="tel"
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Mật khẩu</Form.Label>
                    <Form.Control
                      type="password"
                      value={form.password}
                      onChange={(e) => onChange('password', e.target.value)}
                      autoComplete="new-password"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Xác nhận mật khẩu</Form.Label>
                    <Form.Control
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => onChange('confirmPassword', e.target.value)}
                      autoComplete="new-password"
                    />
                  </Form.Group>
                  <Button type="submit" className="w-100 mb-2" disabled={submitting}>
                    {submitting ? 'Đang gửi…' : 'Đăng ký'}
                  </Button>
                  <div className="small text-muted text-center">
                    Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
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
