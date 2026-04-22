import { describe, expect, it } from 'vitest'
import { bookingSchema, registerSchema } from './validationSchemas'

describe('validationSchemas', () => {
  it('accepts valid register payload', () => {
    const result = registerSchema.safeParse({
      fullName: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      phone: '0912345678',
      password: '123456',
      confirmPassword: '123456',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid booking payload', () => {
    const result = bookingSchema.safeParse({
      patientName: '',
      phone: '12',
      email: 'bad-email',
      selectedScheduleId: '',
    })
    expect(result.success).toBe(false)
  })
})
