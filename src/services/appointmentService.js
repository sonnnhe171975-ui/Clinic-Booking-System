import { api } from '../api/client'
import { endpoints } from '../api/config'
import {
  applyAppointmentStatusChange,
  bookAppointmentAtomic,
  cancelAppointmentAndReleaseSlot,
  rescheduleAppointment,
} from '../utils/appointmentFlow'

export async function getAllAppointments() {
  return api.get(endpoints.appointments)
}

export async function getAppointmentsByUser(userId) {
  return api.get(`${endpoints.appointments}?userId=${userId}`)
}

export async function getAppointmentById(id) {
  return api.get(`${endpoints.appointments}/${id}`)
}

export async function bookAppointment(payload) {
  return bookAppointmentAtomic(payload)
}

export async function cancelAppointment(appt, actorRole = 'system') {
  return cancelAppointmentAndReleaseSlot(appt, actorRole)
}

export async function updateAppointmentStatus(appt, nextStatus, actorRole = 'system') {
  return applyAppointmentStatusChange(appt, nextStatus, actorRole)
}

export async function changeAppointmentSchedule(
  oldAppt,
  newScheduleId,
  bookingPayload,
  actorRole = 'patient'
) {
  return rescheduleAppointment(oldAppt, newScheduleId, bookingPayload, actorRole)
}
