import { api } from '../api/client'
import { endpoints } from '../api/config'

export async function appendAuditLog(payload) {
  return api.post(endpoints.auditLogs, {
    ...payload,
    createdAt: new Date().toISOString(),
  })
}

export async function getAuditLogs(limit = 100) {
  return api.get(`${endpoints.auditLogs}?_sort=createdAt&_order=desc&_limit=${limit}`)
}
