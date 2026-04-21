import { Button, Card, Container } from 'react-bootstrap'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import AppNavbar from '../components/AppNavbar'
import AppFooter from '../components/AppFooter'
import DashboardLayout from '../components/DashboardLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import { AuthProvider } from '../hooks/AuthProvider'
import AdminAppointmentsPage from '../pages/AdminAppointmentsPage'
import AdminCrudPage from '../pages/AdminCrudPage'
import AdminHomePage from '../pages/AdminHomePage'
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
          <Card.Title>404 - Khong tim thay trang</Card.Title>
          <Card.Text>Duong dan ban truy cap khong ton tai.</Card.Text>
          <Button href="/" variant="primary">
            Quay ve trang chu
          </Button>
        </Card.Body>
      </Card>
    </Container>
  )
}

function AppRoutes() {
  const location = useLocation()
  const isAuthPage = ['/login', '/register'].includes(location.pathname)

  return (
    <AuthProvider>
      <div className="app-shell">
        {!isAuthPage && <AppNavbar />}
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/specialties" element={<SpecialtiesPage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/doctors/:id" element={<DoctorDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/patient"
              element={
                <ProtectedRoute allow={['patient']}>
                  <DashboardLayout role="patient" title="Patient Dashboard">
                    <PatientDashboardPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/appointments"
              element={
                <ProtectedRoute allow={['patient']}>
                  <DashboardLayout role="patient" title="Lich hen cua toi">
                    <PatientAppointmentsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/doctors"
              element={
                <ProtectedRoute allow={['patient']}>
                  <DashboardLayout role="patient" title="Dat lich kham">
                    <DoctorsPage detailBasePath="/patient/doctors" />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/doctors/:id"
              element={
                <ProtectedRoute allow={['patient']}>
                  <DashboardLayout role="patient" title="Chi tiet bac si">
                    <DoctorDetailPage backFallback="/patient/doctors" />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor"
              element={
                <ProtectedRoute allow={['doctor']}>
                  <DashboardLayout role="doctor" title="Lich dang ky benh nhan">
                    <DoctorAppointmentsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patients"
              element={
                <ProtectedRoute allow={['doctor']}>
                  <DashboardLayout role="doctor" title="Ho so benh nhan">
                    <DoctorAppointmentsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allow={['admin']}>
                  <DashboardLayout role="admin" title="Admin Dashboard">
                    <AdminHomePage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/specialties"
              element={
                <ProtectedRoute allow={['admin']}>
                  <DashboardLayout role="admin" title="Quan ly chuyen khoa">
                    <AdminCrudPage resource="specialties" />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/doctors"
              element={
                <ProtectedRoute allow={['admin']}>
                  <DashboardLayout role="admin" title="Quan ly bac si">
                    <AdminCrudPage resource="doctors" />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/schedules"
              element={
                <ProtectedRoute allow={['admin']}>
                  <DashboardLayout role="admin" title="Quan ly lich kham">
                    <AdminCrudPage resource="schedules" />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allow={['admin']}>
                  <DashboardLayout role="admin" title="Quan ly nguoi dung">
                    <AdminCrudPage resource="users" />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/appointments"
              element={
                <ProtectedRoute allow={['admin']}>
                  <DashboardLayout role="admin" title="Quan ly lich hen">
                    <AdminAppointmentsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        {!isAuthPage && <AppFooter />}
      </div>
      <ToastContainer position="top-right" autoClose={1800} />
    </AuthProvider>
  )
}

export default AppRoutes
