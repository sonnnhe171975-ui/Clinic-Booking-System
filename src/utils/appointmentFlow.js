import { api } from '../api/client'
import { endpoints } from '../api/config'
import { APPOINTMENT_STATUS, isTerminalAppointmentStatus } from '../constants/appointmentStatus'
import { canTransitionAppointmentStatus } from './permissions'

async function getUsers() {
  return api.get(endpoints.users)
}

async function getDoctorAccountByDoctorId(doctorId) {
  const users = await getUsers()
  return users.find(
    (u) => String(u.role) === 'doctor' && String(u.doctorId) === String(doctorId)
  )
}

async function getAdminAccounts() {
  const users = await getUsers()
  return users.filter((u) => String(u.role) === 'admin')
}

async function createNotificationSafe(payload) {
  try {
    await api.post(endpoints.notifications, {
      ...payload,
      isRead: false,
      createdAt: payload.createdAt || new Date().toISOString(),
    })
  } catch {
    /* ignore notification write error */
  }
}

async function createAuditLogSafe(payload) {
  try {
    await api.post(endpoints.auditLogs, {
      ...payload,
      createdAt: new Date().toISOString(),
    })
  } catch {
    /* ignore audit write error */
  }
}

async function emitBookedNotifications(appt) {
  const [doctorAccount, admins] = await Promise.all([
    getDoctorAccountByDoctorId(appt.doctorId),
    getAdminAccounts(),
  ])
  const tasks = []
  if (doctorAccount) {
    tasks.push(
      createNotificationSafe({
        userId: String(doctorAccount.id),
        role: 'doctor',
        type: 'pending_appointment',
        title: `${appt.patientName || 'Bệnh nhân'} vừa đăng ký lịch`,
        subtitle: `Lịch #${appt.id} - ca #${appt.scheduleId}`,
        body: 'Có lịch hẹn mới chờ xác nhận',
        relatedId: String(appt.id),
        to: `/doctor?appointmentId=${encodeURIComponent(appt.id)}`,
      })
    )
  }
  admins.forEach((admin) => {
    tasks.push(
      createNotificationSafe({
        userId: String(admin.id),
        role: 'admin',
        type: 'admin_pending',
        title: `Lịch mới chờ duyệt #${appt.id}`,
        subtitle: `${appt.patientName || 'Bệnh nhân'} -> BS #${appt.doctorId}`,
        body: 'Có lịch hẹn chờ bác sĩ xác nhận',
        relatedId: String(appt.id),
        to: '/admin/appointments',
      })
    )
  })
  await Promise.all(tasks)
}

async function emitStatusNotifications(appt, nextStatus) {
  await createNotificationSafe({
    userId: String(appt.userId),
    role: 'patient',
    type: 'appointment_status',
    title: `Lịch #${appt.id} cập nhật trạng thái`,
    subtitle: `Trạng thái mới: ${nextStatus}`,
    body: 'Vui lòng kiểm tra lịch hẹn của bạn',
    relatedId: String(appt.id),
    to: '/patient/appointments',
  })
}

async function getNextAppointmentId() {
  const all = await api.get(endpoints.appointments)
  let maxId = 0
  all.forEach((item) => {
    const raw = String(item.id ?? '').trim()
    if (!/^\d+$/.test(raw)) return
    const n = Number(raw)
    if (n > maxId) maxId = n
  })
  return maxId + 1
}

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

function parseScheduleStartDateTime(schedule) {
  const date = String(schedule?.date || '').trim()
  const range = String(schedule?.time || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const startTime = range.split('-')[0]?.trim()
  if (!/^\d{2}:\d{2}$/.test(startTime || '')) return null
  const dt = new Date(`${date}T${startTime}:00`)
  if (Number.isNaN(dt.getTime())) return null
  return dt
}

export function isScheduleInPast(schedule, now = new Date()) {
  const startAt = parseScheduleStartDateTime(schedule)
  if (!startAt) return false
  return startAt.getTime() < now.getTime()
}

/**
 * Đổi trạng thái lịch hẹn + đồng bộ currentSlot (admin / bác sĩ, trừ luồng hủy dùng cancelAppointmentAndReleaseSlot).
 */
export async function applyAppointmentStatusChange(appt, nextStatus, actorRole = 'system') {
  const old = appt.status || APPOINTMENT_STATUS.CONFIRMED
  if (old === nextStatus) {
    return { ok: true }
  }
  if (
    actorRole !== 'system' &&
    !canTransitionAppointmentStatus(actorRole, old, nextStatus)
  ) {
    return { ok: false, error: 'Bạn không có quyền chuyển trạng thái này' }
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
  const body = { ...appt, status: nextStatus }
  const clearsRescheduleRequest =
    nextStatus === APPOINTMENT_STATUS.CANCELLED ||
    nextStatus === APPOINTMENT_STATUS.CHECKED_IN ||
    nextStatus === APPOINTMENT_STATUS.COMPLETED ||
    nextStatus === APPOINTMENT_STATUS.NO_SHOW
  if (clearsRescheduleRequest) {
    body.rescheduleToScheduleId = null
    body.rescheduleRequestedAt = null
  }
  await api.put(`${endpoints.appointments}/${appt.id}`, body)
  if (delta !== 0) {
    await adjustScheduleCurrentSlot(appt.scheduleId, delta)
  }
  await Promise.all([
    emitStatusNotifications(appt, nextStatus),
    createAuditLogSafe({
      actorId: 'system',
      actorRole: 'system',
      action: 'appointment_status_changed',
      resourceType: 'appointments',
      resourceId: String(appt.id),
      metadata: { from: old, to: nextStatus },
    }),
  ])
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
 * Các ngày (YYYY-MM-DD) mà bệnh nhân đã có lịch còn hiệu lực — dùng để tránh hai hẹn cùng ngày.
 * Bỏ qua một appointment (ví dụ lịch đang xin đổi).
 */
export function getOccupiedDatesForPatient(appointments, schedules, excludeAppointmentId) {
  const schedMap = {}
  schedules.forEach((s) => {
    schedMap[String(s.id)] = s
  })
  const dates = new Set()
  for (const a of appointments) {
    if (excludeAppointmentId != null && String(a.id) === String(excludeAppointmentId)) continue
    if (!isActiveBookingForDuplicate(a)) continue
    const sch = schedMap[String(a.scheduleId)]
    const d = String(sch?.date || '').trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) dates.add(d)
  }
  return dates
}

async function emitRescheduleRequestNotifications(appt, targetSchedule) {
  const admins = await getAdminAccounts()
  await Promise.all(
    admins.map((admin) =>
      createNotificationSafe({
        userId: String(admin.id),
        role: 'admin',
        type: 'reschedule_request',
        title: `Yêu cầu đổi lịch #${appt.id}`,
        subtitle: `${appt.patientName || 'Bệnh nhân'} → ${targetSchedule.date} ${targetSchedule.time}`,
        body: 'Cần duyệt đổi lịch trên trang quản trị',
        relatedId: String(appt.id),
        to: '/admin/appointments',
      })
    )
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
  if (String(schedule.doctorId) !== String(doctorId)) {
    return { ok: false, error: 'Lịch khám không thuộc bác sĩ đã chọn' }
  }
  if (isScheduleInPast(schedule)) {
    return { ok: false, error: 'Không thể đặt lịch trong quá khứ' }
  }
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
    id: await getNextAppointmentId(),
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
  await Promise.all([
    emitBookedNotifications(created),
    createAuditLogSafe({
      actorId: String(userId),
      actorRole: 'patient',
      action: 'appointment_created',
      resourceType: 'appointments',
      resourceId: String(created.id),
      metadata: { doctorId: Number(doctorId), scheduleId: Number(scheduleId) },
    }),
  ])
  return { ok: true, appointment: created }
}

/**
 * Hủy lịch + trả slot (pending / confirmed / checked_in).
 */
export async function cancelAppointmentAndReleaseSlot(appt, actorRole = 'system') {
  const status = appt.status || APPOINTMENT_STATUS.CONFIRMED
  if (status === APPOINTMENT_STATUS.CANCELLED) {
    return { ok: true }
  }
  if (isTerminalAppointmentStatus(status)) {
    return { ok: false, error: 'Không thể hủy lịch ở trạng thái này' }
  }
  return applyAppointmentStatusChange(appt, APPOINTMENT_STATUS.CANCELLED, actorRole)
}

/**
 * Đổi lịch: đặt ca mới trước, hủy ca cũ sau; nếu hủy cũ lỗi thì rollback ca mới.
 */
export async function rescheduleAppointment(
  oldAppt,
  newScheduleId,
  bookingPayload,
  actorRole = 'patient'
) {
  const bookRes = await bookAppointmentAtomic({
    ...bookingPayload,
    scheduleId: newScheduleId,
  })
  if (!bookRes.ok) return bookRes

  const cancelRes = await cancelAppointmentAndReleaseSlot(oldAppt, actorRole)
  if (!cancelRes.ok) {
    const rollback = await cancelAppointmentAndReleaseSlot(bookRes.appointment, 'system')
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

function assertRescheduleTargetValid(appt, newSch, occupiedDates) {
  if (String(newSch.doctorId) !== String(appt.doctorId)) {
    return { ok: false, error: 'Ca mới không thuộc bác sĩ của lịch hiện tại' }
  }
  if (String(newSch.id) === String(appt.scheduleId)) {
    return { ok: false, error: 'Ca mới trùng với ca hiện tại' }
  }
  if (isScheduleInPast(newSch)) {
    return { ok: false, error: 'Không thể chọn ca trong quá khứ' }
  }
  if (Number(newSch.currentSlot) >= Number(newSch.maxSlot)) {
    return { ok: false, error: 'Ca này đã đầy' }
  }
  const d = String(newSch.date || '').trim()
  if (occupiedDates.has(d)) {
    return {
      ok: false,
      error: 'Bạn đã có lịch khác vào ngày này; chỉ hiển thị các ngày còn trống để tránh trùng',
    }
  }
  return { ok: true }
}

/**
 * Bệnh nhân gửi yêu cầu đổi lịch (chưa chiếm slot ca mới) — admin duyệt sau.
 */
export async function requestPatientReschedule(apptId, newScheduleId, requesterUserId) {
  if (requesterUserId == null || String(requesterUserId).trim() === '') {
    return { ok: false, error: 'Thiếu thông tin tài khoản bệnh nhân' }
  }
  const appt = await api.get(`${endpoints.appointments}/${apptId}`)
  if (String(appt.userId) !== String(requesterUserId)) {
    return { ok: false, error: 'Không thể gửi yêu cầu cho lịch của người khác' }
  }
  if (appt.rescheduleToScheduleId != null && appt.rescheduleToScheduleId !== '') {
    return { ok: false, error: 'Lịch này đang có yêu cầu đổi lịch chờ duyệt' }
  }
  const status = appt.status || APPOINTMENT_STATUS.CONFIRMED
  if (status !== APPOINTMENT_STATUS.PENDING && status !== APPOINTMENT_STATUS.CONFIRMED) {
    return { ok: false, error: 'Không thể xin đổi lịch ở trạng thái này' }
  }

  const [userAppts, schedules] = await Promise.all([
    api.get(`${endpoints.appointments}?userId=${appt.userId}`),
    api.get(endpoints.schedules),
  ])
  const occupied = getOccupiedDatesForPatient(userAppts, schedules, appt.id)
  const newSch = schedules.find((s) => String(s.id) === String(newScheduleId))
  if (!newSch) {
    return { ok: false, error: 'Không tìm thấy ca đích' }
  }
  const check = assertRescheduleTargetValid(appt, newSch, occupied)
  if (!check.ok) return check

  await api.put(`${endpoints.appointments}/${appt.id}`, {
    ...appt,
    rescheduleToScheduleId: Number(newScheduleId),
    rescheduleRequestedAt: new Date().toISOString(),
  })
  await Promise.all([
    emitRescheduleRequestNotifications(appt, newSch),
    createAuditLogSafe({
      actorId: String(appt.userId),
      actorRole: 'patient',
      action: 'reschedule_requested',
      resourceType: 'appointments',
      resourceId: String(appt.id),
      metadata: { toScheduleId: Number(newScheduleId) },
    }),
  ])
  return { ok: true }
}

/**
 * Admin duyệt yêu cầu đổi lịch (đặt ca mới + hủy ca cũ).
 */
export async function approveRescheduleRequest(appt, actorRole = 'admin') {
  if (actorRole !== 'admin' && actorRole !== 'system') {
    return { ok: false, error: 'Chỉ quản trị mới duyệt đổi lịch' }
  }
  const raw = await api.get(`${endpoints.appointments}/${appt.id}`)
  const rid = raw.rescheduleToScheduleId
  if (rid == null || rid === '') {
    return { ok: false, error: 'Không có yêu cầu đổi lịch' }
  }
  const st = raw.status || APPOINTMENT_STATUS.CONFIRMED
  if (st !== APPOINTMENT_STATUS.PENDING && st !== APPOINTMENT_STATUS.CONFIRMED) {
    return {
      ok: false,
      error: 'Lịch không còn ở trạng thái cho phép đổi (ví dụ đã check-in hoặc đã hủy)',
    }
  }

  const [userAppts, schedules] = await Promise.all([
    api.get(`${endpoints.appointments}?userId=${raw.userId}`),
    api.get(endpoints.schedules),
  ])
  const occupied = getOccupiedDatesForPatient(userAppts, schedules, raw.id)
  const newSch = schedules.find((s) => String(s.id) === String(rid))
  if (!newSch) {
    return { ok: false, error: 'Ca đích không còn tồn tại' }
  }
  const check = assertRescheduleTargetValid(raw, newSch, occupied)
  if (!check.ok) return check

  const bookingPayload = {
    userId: raw.userId,
    doctorId: raw.doctorId,
    patientName: raw.patientName,
    phone: raw.phone,
    email: raw.email || '',
    address: raw.address || '',
    note: raw.note || '',
  }
  const res = await rescheduleAppointment(raw, Number(rid), bookingPayload, actorRole)
  if (!res.ok) return res

  await Promise.all([
    createNotificationSafe({
      userId: String(raw.userId),
      role: 'patient',
      type: 'appointment_status',
      title: 'Yêu cầu đổi lịch đã được duyệt',
      subtitle: `Lịch mới: ca #${rid}`,
      body: 'Vui lòng xem lại lịch hẹn của bạn',
      relatedId: String(res.appointment?.id || raw.id),
      to: '/patient/appointments',
    }),
    createAuditLogSafe({
      actorId: 'admin',
      actorRole: 'admin',
      action: 'reschedule_approved',
      resourceType: 'appointments',
      resourceId: String(raw.id),
      metadata: { newAppointmentId: res.appointment?.id, toScheduleId: Number(rid) },
    }),
  ])
  return { ok: true, appointment: res.appointment }
}

/**
 * Admin từ chối yêu cầu đổi lịch (không đổi slot).
 */
export async function rejectRescheduleRequest(appt, actorRole = 'admin') {
  if (actorRole !== 'admin' && actorRole !== 'system') {
    return { ok: false, error: 'Chỉ quản trị mới từ chối yêu cầu' }
  }
  const raw = await api.get(`${endpoints.appointments}/${appt.id}`)
  if (raw.rescheduleToScheduleId == null || raw.rescheduleToScheduleId === '') {
    return { ok: false, error: 'Không có yêu cầu đổi lịch' }
  }
  await api.put(`${endpoints.appointments}/${raw.id}`, {
    ...raw,
    rescheduleToScheduleId: null,
    rescheduleRequestedAt: null,
  })
  await Promise.all([
    createNotificationSafe({
      userId: String(raw.userId),
      role: 'patient',
      type: 'appointment_status',
      title: 'Yêu cầu đổi lịch không được duyệt',
      subtitle: `Lịch #${raw.id} giữ nguyên`,
      body: 'Vui lòng chọn ca khác hoặc liên hệ lễ tân',
      relatedId: String(raw.id),
      to: '/patient/appointments',
    }),
    createAuditLogSafe({
      actorId: 'admin',
      actorRole: 'admin',
      action: 'reschedule_rejected',
      resourceType: 'appointments',
      resourceId: String(raw.id),
      metadata: {},
    }),
  ])
  return { ok: true }
}
