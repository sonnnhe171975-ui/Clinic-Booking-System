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

export async function cancelAppointment(appt) {
  return cancelAppointmentAndReleaseSlot(appt)
}

export async function updateAppointmentStatus(appt, nextStatus) {
  return applyAppointmentStatusChange(appt, nextStatus)
}

export async function changeAppointmentSchedule(oldAppt, newScheduleId, bookingPayload) {
  return rescheduleAppointment(oldAppt, newScheduleId, bookingPayload)
}
