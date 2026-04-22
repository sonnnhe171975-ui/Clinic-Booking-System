import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import ProtectedRoute from './ProtectedRoute'
import { AuthContext } from '../hooks/useAuthContext'

function renderWithAuth(user, allow = ['patient']) {
  return render(
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'guest',
        isAdmin: user?.role === 'admin',
        isDoctor: user?.role === 'doctor',
        isPatient: user?.role === 'patient',
      }}
    >
      <MemoryRouter initialEntries={['/patient']}>
        <Routes>
          <Route
            path="/patient"
            element={
              <ProtectedRoute allow={allow}>
                <div>Protected Page</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

describe('ProtectedRoute', () => {
  it('redirects guest to login', () => {
    renderWithAuth(null)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('renders protected page for allowed role', () => {
    renderWithAuth({ id: '2', role: 'patient' }, ['patient'])
    expect(screen.getByText('Protected Page')).toBeInTheDocument()
  })
})
