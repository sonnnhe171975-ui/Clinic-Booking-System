/** Trạng thái lịch hẹn — đồng bộ với field `status` trên appointment (DB + API). */
export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  CHECKED_IN: 'checked_in',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
}

export const APPOINTMENT_STATUS_LABEL_VI = {
  [APPOINTMENT_STATUS.PENDING]: 'Chờ xác nhận',
  [APPOINTMENT_STATUS.CONFIRMED]: 'Đã xác nhận',
  [APPOINTMENT_STATUS.CANCELLED]: 'Đã hủy',
  [APPOINTMENT_STATUS.CHECKED_IN]: 'Đã đến',
  [APPOINTMENT_STATUS.COMPLETED]: 'Đã khám xong',
  [APPOINTMENT_STATUS.NO_SHOW]: 'Không đến',
}

export function appointmentStatusVariant(status) {
  switch (status) {
    case APPOINTMENT_STATUS.PENDING:
      return 'warning'
    case APPOINTMENT_STATUS.CONFIRMED:
      return 'primary'
    case APPOINTMENT_STATUS.CANCELLED:
      return 'secondary'
    case APPOINTMENT_STATUS.CHECKED_IN:
      return 'info'
    case APPOINTMENT_STATUS.COMPLETED:
      return 'success'
    case APPOINTMENT_STATUS.NO_SHOW:
      return 'danger'
    default:
      return 'light'
  }
}

export function isTerminalAppointmentStatus(status) {
  return status === APPOINTMENT_STATUS.COMPLETED || status === APPOINTMENT_STATUS.NO_SHOW
}

/** Lịch hẹn đang chiếm suất trong ca (đồng bộ logic slot trong appointmentFlow: no_show vẫn giữ suất). */
export function isSlotConsumingStatus(status) {
  const s = status || APPOINTMENT_STATUS.CONFIRMED
  if (s === APPOINTMENT_STATUS.CANCELLED || s === APPOINTMENT_STATUS.COMPLETED) return false
  return true
}

export function canPatientCancelOrReschedule(status) {
  if (!status) return true
  return status === APPOINTMENT_STATUS.PENDING || status === APPOINTMENT_STATUS.CONFIRMED
}

/** Tất cả giá trị hợp lệ lưu DB / select admin */
export const APPOINTMENT_STATUS_OPTIONS = [
  APPOINTMENT_STATUS.PENDING,
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.CANCELLED,
  APPOINTMENT_STATUS.CHECKED_IN,
  APPOINTMENT_STATUS.COMPLETED,
  APPOINTMENT_STATUS.NO_SHOW,
]
