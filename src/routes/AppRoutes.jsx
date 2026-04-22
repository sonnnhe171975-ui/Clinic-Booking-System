import { Button, Card, Container } from 'react-bootstrap'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import AppNavbar from '../components/AppNavbar'
import AppFooter from '../components/AppFooter'
import DashboardLayout from '../components/DashboardLayout'
import DoctorPublicRedirect from '../components/DoctorPublicRedirect'
import ProtectedRoute from '../components/ProtectedRoute'
import { AuthProvider } from '../hooks/AuthProvider'
import { useAuthContext } from '../hooks/useAuthContext'
import { AppStateProvider } from '../state/AppStateContext'
import AdminAppointmentsPage from '../pages/AdminAppointmentsPage'
import AdminCrudPage from '../pages/AdminCrudPage'
import AdminHomePage from '../pages/AdminHomePage'
import AdminMonitoringPage from '../pages/AdminMonitoringPage'
import AboutPage from '../pages/AboutPage'
import DoctorAppointmentsPage from '../pages/DoctorAppointmentsPage'
import DoctorDetailPage from '../pages/DoctorDetailPage'
import DoctorsPage from '../pages/DoctorsPage'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import PatientAppointmentsPage from '../pages/PatientAppointmentsPage'
import PatientDashboardPage from '../pages/PatientDashboardPage'
import RegisterPage from '../pages/RegisterPage'
import SpecialtiesPage from '../pages/SpecialtiesPage'

function NotFoundPage() {
  return (
    <Container className="py-4">
      <Card className="text-center shadow-sm">
        <Card.Body>
          <Card.Title>404 — Không tìm thấy trang</Card.Title>
          <Card.Text>Đường dẫn bạn truy cập không tồn tại.</Card.Text>
          <Button href="/" variant="primary">
            Quay về trang chủ
          </Button>
        </Card.Body>
      </Card>
    </Container>
  )
}

function AppShell() {
  const location = useLocation()
  const { isDoctor } = useAuthContext()
  const isAuthPage = ['/login', '/register'].includes(location.pathname)
  const showFooter = !isAuthPage && !isDoctor

  return (
    <div className="app-shell">
      {!isAuthPage && <AppNavbar />}
      <main className="app-main">
        <Routes>
            <Route
              path="/"
              element={
                <DoctorPublicRedirect>
                  <HomePage />
                </DoctorPublicRedirect>
              }
            />
            <Route
              path="/about"
              element={
                <DoctorPublicRedirect>
                  <AboutPage />
                </DoctorPublicRedirect>
              }
            />
            <Route
              path="/specialties"
              element={
                <DoctorPublicRedirect>
                  <SpecialtiesPage />
                </DoctorPublicRedirect>
              }
            />
            <Route
              path="/doctors"
              element={
                <DoctorPublicRedirect>
                  <DoctorsPage />
                </DoctorPublicRedirect>
              }
            />
            <Route
              path="/doctors/:id"
              element={
                <DoctorPublicRedirect>
                  <DoctorDetailPage />
                </DoctorPublicRedirect>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/patient"
              element={
                <ProtectedRoute allow={['patient']}>
                  <DashboardLayout role="patient" title="Bảng điều khiển bệnh nhân">
                    <PatientDashboardPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/appointments"
              element={
                <ProtectedRoute allow={['patient']}>
                  <DashboardLayout role="patient" title="Lịch hẹn của tôi">
                    <PatientAppointmentsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/doctors"
              element={
                <ProtectedRoute allow={['patient']}>
                  <DashboardLayout role="patient" title="Đặt lịch khám">
                    <DoctorsPage detailBasePath="/patient/doctors" />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/doctors/:id"
              element={
                <ProtectedRoute allow={['patient']}>
                  <DashboardLayout role="patient" title="Chi tiết bác sĩ">
                    <DoctorDetailPage backFallback="/patient/doctors" />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor"
              element={
                <ProtectedRoute allow={['doctor']}>
                  <DashboardLayout role="doctor" title="Lịch đăng ký bệnh nhân">
                    <DoctorAppointmentsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/doctor/patients" element={<Navigate to="/doctor" replace />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allow={['admin']}>
                  <DashboardLayout role="admin" title="Bảng điều khiển quản trị">
                    <AdminHomePage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/specialties"
              element={
                <ProtectedRoute allow={['admin']}>
                  <DashboardLayout role="admin" title="Quản lý chuyên khoa">
                    <AdminCrudPage resource="specialties" />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/doctors"
              element={
                <ProtectedRoute allow={['admin']}>
                  <DashboardLayout role="admin" title="Quản lý bác sĩ">
                    <AdminCrudPage resource="doctors" />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/schedules"
              element={
                <ProtectedRoute allow={['admin']}>
                  <DashboardLayout role="admin" title="Quản lý lịch khám">
                    <AdminCrudPage resource="schedules" />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allow={['admin']}>
                  <DashboardLayout role="admin" title="Quản lý người dùng">
                    <AdminCrudPage resource="users" />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/appointments"
              element={
                <ProtectedRoute allow={['admin']}>
                  <DashboardLayout role="admin" title="Quản lý lịch hẹn">
                    <AdminAppointmentsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/monitoring"
              element={
                <ProtectedRoute allow={['admin']}>
                  <DashboardLayout role="admin" title="Giám sát nghiệp vụ">
                    <AdminMonitoringPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/medical-records"
              element={
                <ProtectedRoute allow={['admin']}>
                  <DashboardLayout role="admin" title="Quản lý hồ sơ khám">
                    <AdminCrudPage resource="medicalRecords" />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/prescriptions"
              element={
                <ProtectedRoute allow={['admin']}>
                  <DashboardLayout role="admin" title="Quản lý đơn thuốc">
                    <AdminCrudPage resource="prescriptions" />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute allow={['admin']}>
                  <DashboardLayout role="admin" title="Quản lý thanh toán">
                    <AdminCrudPage resource="payments" />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <ProtectedRoute allow={['admin']}>
                  <DashboardLayout role="admin" title="Quản lý thông báo">
                    <AdminCrudPage resource="notifications" />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allow={['admin']}>
                  <DashboardLayout role="admin" title="Quản lý audit logs">
                    <AdminCrudPage resource="auditLogs" />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
      </main>
      {showFooter && <AppFooter />}
    </div>
  )
}

function AppRoutes() {
  return (
    <AuthProvider>
      <AppStateProvider>
        <AppShell />
        <ToastContainer position="top-right" autoClose={1800} />
      </AppStateProvider>
    </AuthProvider>
  )
}

export default AppRoutes
