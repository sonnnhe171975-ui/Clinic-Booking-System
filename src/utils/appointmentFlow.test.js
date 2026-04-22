import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    del: vi.fn(),
  },
}))

vi.mock('../api/client', () => ({
  api: mockApi,
}))

import { APPOINTMENT_STATUS } from '../constants/appointmentStatus'
import { applyAppointmentStatusChange } from './appointmentFlow'

describe('appointmentFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns ok when status unchanged', async () => {
    const appt = { id: '1', scheduleId: 10, status: APPOINTMENT_STATUS.CONFIRMED }
    const res = await applyAppointmentStatusChange(appt, APPOINTMENT_STATUS.CONFIRMED)
    expect(res).toEqual({ ok: true })
    expect(mockApi.put).not.toHaveBeenCalled()
  })

  it('updates appointment and schedule slot when cancelling confirmed appointment', async () => {
    const appt = { id: '1', scheduleId: 10, status: APPOINTMENT_STATUS.CONFIRMED }
    mockApi.get.mockResolvedValueOnce({ id: 10, currentSlot: 3, maxSlot: 5, status: 'available' })
    mockApi.put.mockResolvedValue({})

    const res = await applyAppointmentStatusChange(appt, APPOINTMENT_STATUS.CANCELLED)
    expect(res.ok).toBe(true)
    expect(mockApi.put).toHaveBeenCalledTimes(2)
  })
})
