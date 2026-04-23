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

export function canTransitionAppointmentStatus(role, currentStatus, nextStatus) {
  const current = currentStatus || APPOINTMENT_STATUS.CONFIRMED
  if (!nextStatus || current === nextStatus) return false

  const strictFlow = {
    [APPOINTMENT_STATUS.PENDING]: [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.CANCELLED],
    [APPOINTMENT_STATUS.CONFIRMED]: [
      APPOINTMENT_STATUS.CHECKED_IN,
      APPOINTMENT_STATUS.NO_SHOW,
      APPOINTMENT_STATUS.CANCELLED,
    ],
    [APPOINTMENT_STATUS.CHECKED_IN]: [APPOINTMENT_STATUS.COMPLETED],
    [APPOINTMENT_STATUS.CANCELLED]: [],
    [APPOINTMENT_STATUS.COMPLETED]: [],
    [APPOINTMENT_STATUS.NO_SHOW]: [],
  }

  // Admin/doctor đi theo luồng chặt để tránh nhảy trạng thái không thực tế.
  if (role === 'admin' || role === 'doctor') {
    return (strictFlow[current] || []).includes(nextStatus)
  }

  // Patient chỉ được hủy ở trạng thái còn xử lý.
  if (role === 'patient') {
    return (
      nextStatus === APPOINTMENT_STATUS.CANCELLED &&
      (current === APPOINTMENT_STATUS.PENDING || current === APPOINTMENT_STATUS.CONFIRMED)
    )
  }

  return false
}

export function canPatientBookAppointment(role) {
  return role === 'patient'
}

export function canPatientManageAppointmentStatus(status) {
  const st = status || APPOINTMENT_STATUS.CONFIRMED
  return st === APPOINTMENT_STATUS.PENDING || st === APPOINTMENT_STATUS.CONFIRMED
}
