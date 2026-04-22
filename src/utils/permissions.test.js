import { describe, expect, it } from 'vitest'
import { APPOINTMENT_STATUS } from '../constants/appointmentStatus'
import { canDoctorApplyAction, DOCTOR_ACTION, getDoctorAllowedActions } from './permissions'

describe('permissions', () => {
  it('returns confirm/reject actions for pending', () => {
    const actions = getDoctorAllowedActions(APPOINTMENT_STATUS.PENDING)
    expect(actions).toContain(DOCTOR_ACTION.CONFIRM)
    expect(actions).toContain(DOCTOR_ACTION.REJECT)
    expect(canDoctorApplyAction(APPOINTMENT_STATUS.PENDING, DOCTOR_ACTION.CHECK_IN)).toBe(false)
  })

  it('returns complete for checked_in', () => {
    expect(canDoctorApplyAction(APPOINTMENT_STATUS.CHECKED_IN, DOCTOR_ACTION.COMPLETE)).toBe(true)
    expect(canDoctorApplyAction(APPOINTMENT_STATUS.CHECKED_IN, DOCTOR_ACTION.CANCEL)).toBe(false)
  })
})
