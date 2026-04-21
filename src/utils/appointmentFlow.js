import { api } from '../api/client'
import { endpoints } from '../api/config'
import { APPOINTMENT_STATUS, isTerminalAppointmentStatus } from '../constants/appointmentStatus'

/** Đã hủy / đã khám xong → không chiếm chỗ; no_show vẫn giữ suất. */
function countsTowardFilledSlots(status) {
  const s = status || APPOINTMENT_STATUS.CONFIRMED
  if (s === APPOINTMENT_STATUS.CANCELLED || s === APPOINTMENT_STATUS.COMPLETED) return false
  return true
}

function slotDeltaForStatusChange(oldStatus, newStatus) {
  const old = oldStatus || APPOINTMENT_STATUS.CONFIRMED
  const next = newStatus
  const a = countsTowardFilledSlots(old) ? 1 : 0
  const b = countsTowardFilledSlots(next) ? 1 : 0
  return b - a
}

/**
 * Đổi trạng thái lịch hẹn + đồng bộ currentSlot (admin / bác sĩ, trừ luồng hủy dùng cancelAppointmentAndReleaseSlot).
 */
export async function applyAppointmentStatusChange(appt, nextStatus) {
  const old = appt.status || APPOINTMENT_STATUS.CONFIRMED
  if (old === nextStatus) {
    return { ok: true }
  }
  const delta = slotDeltaForStatusChange(old, nextStatus)
  if (delta > 0) {
    const sched = await fetchScheduleById(appt.scheduleId)
    if (Number(sched.currentSlot) >= Number(sched.maxSlot)) {
      return {
        ok: false,
        error:
          'Ca đã đầy, không thể cập nhật trạng thái này (cần giảm slot hoặc tăng maxSlot)',
      }
    }
  }
  await api.put(`${endpoints.appointments}/${appt.id}`, {
    ...appt,
    status: nextStatus,
  })
  if (delta !== 0) {
    await adjustScheduleCurrentSlot(appt.scheduleId, delta)
  }
  return { ok: true }
}

export async function fetchScheduleById(scheduleId) {
  return api.get(`${endpoints.schedules}/${scheduleId}`)
}

/**
 * Điều chỉnh currentSlot trên schedule (+1 đặt lịch, -1 hủy lịch).
 */
export async function adjustScheduleCurrentSlot(scheduleId, delta) {
  const sched = await fetchScheduleById(scheduleId)
  const maxSlot = Number(sched.maxSlot) || 0
  let next = Number(sched.currentSlot) + delta
  if (next < 0) next = 0
  if (maxSlot > 0 && next > maxSlot) next = maxSlot
  const updated = {
    ...sched,
    currentSlot: next,
    status: maxSlot > 0 && next >= maxSlot ? 'full' : 'available',
  }
  await api.put(`${endpoints.schedules}/${scheduleId}`, updated)
  return updated
}

function isActiveBookingForDuplicate(a) {
  const s = a.status || APPOINTMENT_STATUS.CONFIRMED
  return (
    s !== APPOINTMENT_STATUS.CANCELLED &&
    s !== APPOINTMENT_STATUS.COMPLETED &&
    s !== APPOINTMENT_STATUS.NO_SHOW
  )
}

/**
 * Đặt lịch best-effort (json-server): POST appointment rồi tăng slot; nếu tràn slot thì rollback appointment.
 */
export async function bookAppointmentAtomic(payload) {
  const {
    userId,
    doctorId,
    scheduleId,
    patientName,
    phone,
    email,
    address,
    note,
  } = payload

  let schedule = await fetchScheduleById(scheduleId)
  if (Number(schedule.currentSlot) >= Number(schedule.maxSlot)) {
    return { ok: false, error: 'Lịch này đã đầy' }
  }

  const dup = await api.get(
    `${endpoints.appointments}?userId=${userId}&scheduleId=${scheduleId}`
  )
  if (dup.some(isActiveBookingForDuplicate)) {
    return { ok: false, error: 'Bạn đã có lịch hẹn hoạt động ở ca này' }
  }

  const created = await api.post(endpoints.appointments, {
    userId: Number(userId),
    doctorId: Number(doctorId),
    scheduleId: Number(scheduleId),
    patientName,
    phone,
    email: email || '',
    address: address || '',
    note: note || '',
    status: APPOINTMENT_STATUS.PENDING,
    createdAt: new Date().toISOString(),
  })

  schedule = await fetchScheduleById(scheduleId)
  if (Number(schedule.currentSlot) >= Number(schedule.maxSlot)) {
    try {
      await api.del(`${endpoints.appointments}/${created.id}`)
    } catch {
      /* ignore */
    }
    return { ok: false, error: 'Hết slot đồng thời, vui lòng thử lại' }
  }

  await adjustScheduleCurrentSlot(scheduleId, 1)
  return { ok: true, appointment: created }
}

/**
 * Hủy lịch + trả slot (pending / confirmed / checked_in).
 */
export async function cancelAppointmentAndReleaseSlot(appt) {
  const status = appt.status || APPOINTMENT_STATUS.CONFIRMED
  if (status === APPOINTMENT_STATUS.CANCELLED) {
    return { ok: true }
  }
  if (isTerminalAppointmentStatus(status)) {
    return { ok: false, error: 'Không thể hủy lịch ở trạng thái này' }
  }
  return applyAppointmentStatusChange(appt, APPOINTMENT_STATUS.CANCELLED)
}

/**
 * Đổi lịch: đặt ca mới trước, hủy ca cũ sau; nếu hủy cũ lỗi thì rollback ca mới.
 */
export async function rescheduleAppointment(oldAppt, newScheduleId, bookingPayload) {
  const bookRes = await bookAppointmentAtomic({
    ...bookingPayload,
    scheduleId: newScheduleId,
  })
  if (!bookRes.ok) return bookRes

  const cancelRes = await cancelAppointmentAndReleaseSlot(oldAppt)
  if (!cancelRes.ok) {
    const rollback = await cancelAppointmentAndReleaseSlot(bookRes.appointment)
    if (!rollback.ok) {
      return {
        ok: false,
        error: 'Đổi lịch thất bại và cần xử lý thủ công. Vui lòng liên hệ lễ tân.',
      }
    }
    return { ok: false, error: 'Đổi lịch thất bại, vui lòng thử lại' }
  }
  return { ok: true, appointment: bookRes.appointment }
}
