import { APPOINTMENT_STATUS } from '../constants/appointmentStatus'

export const DOCTOR_ACTION = {
  CONFIRM: 'confirm',
  REJECT: 'reject',
  CHECK_IN: 'check_in',
  NO_SHOW: 'no_show',
  CANCEL: 'cancel',
  COMPLETE: 'complete',
}

export function getDoctorAllowedActions(status) {
  const st = status || APPOINTMENT_STATUS.CONFIRMED
  if (st === APPOINTMENT_STATUS.PENDING) {
    return [DOCTOR_ACTION.CONFIRM, DOCTOR_ACTION.REJECT]
  }
  if (st === APPOINTMENT_STATUS.CONFIRMED) {
    return [DOCTOR_ACTION.CHECK_IN, DOCTOR_ACTION.NO_SHOW, DOCTOR_ACTION.CANCEL]
  }
  if (st === APPOINTMENT_STATUS.CHECKED_IN) {
    return [DOCTOR_ACTION.COMPLETE]
  }
  return []
}

export function canDoctorApplyAction(status, action) {
  return getDoctorAllowedActions(status).includes(action)
}

export function canAdminUpdateAppointmentStatus() {
  return true
}

export function canPatientBookAppointment(role) {
  return role === 'patient'
}

export function canPatientManageAppointmentStatus(status) {
  const st = status || APPOINTMENT_STATUS.CONFIRMED
  return st === APPOINTMENT_STATUS.PENDING || st === APPOINTMENT_STATUS.CONFIRMED
}
