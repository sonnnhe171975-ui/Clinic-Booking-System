import { api } from '../api/client'
import { endpoints } from '../api/config'

export async function getMedicalRecordsByUser(userId) {
  return api.get(`${endpoints.medicalRecords}?userId=${userId}`)
}

export async function createMedicalRecord(payload) {
  return api.post(endpoints.medicalRecords, {
    ...payload,
    createdAt: new Date().toISOString(),
  })
}

export async function getPrescriptionsByMedicalRecord(medicalRecordId) {
  return api.get(`${endpoints.prescriptions}?medicalRecordId=${medicalRecordId}`)
}

export async function createPrescription(payload) {
  return api.post(endpoints.prescriptions, {
    ...payload,
    createdAt: new Date().toISOString(),
  })
}

export async function getPaymentsByUser(userId) {
  return api.get(`${endpoints.payments}?userId=${userId}`)
}

export async function createPayment(payload) {
  return api.post(endpoints.payments, {
    ...payload,
    createdAt: new Date().toISOString(),
  })
}
