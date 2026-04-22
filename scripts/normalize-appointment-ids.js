/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '..', 'db.json')

function isNumericId(value) {
  return /^\d+$/.test(String(value || '').trim())
}

function run() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
  const appointments = Array.isArray(db.appointments) ? db.appointments : []

  const idMap = {}
  let maxId = 0
  appointments.forEach((item) => {
    if (!isNumericId(item.id)) return
    const n = Number(item.id)
    if (n > maxId) maxId = n
  })

  appointments.forEach((item) => {
    const oldId = String(item.id)
    if (isNumericId(oldId)) return
    maxId += 1
    item.id = String(maxId)
    idMap[oldId] = String(maxId)
  })

  const refs = ['notifications', 'medicalRecords', 'payments', 'auditLogs']
  refs.forEach((key) => {
    const list = Array.isArray(db[key]) ? db[key] : []
    list.forEach((row) => {
      if (row.relatedId && idMap[String(row.relatedId)]) row.relatedId = idMap[String(row.relatedId)]
      if (row.appointmentId && idMap[String(row.appointmentId)]) {
        row.appointmentId = idMap[String(row.appointmentId)]
      }
      if (row.resourceType === 'appointments' && row.resourceId && idMap[String(row.resourceId)]) {
        row.resourceId = idMap[String(row.resourceId)]
      }
      if (typeof row.to === 'string' && row.to.includes('appointmentId=')) {
        const [prefix, query] = row.to.split('?')
        const params = new URLSearchParams(query || '')
        const apptId = params.get('appointmentId')
        if (apptId && idMap[apptId]) {
          params.set('appointmentId', idMap[apptId])
          row.to = `${prefix}?${params.toString()}`
        }
      }
    })
  })

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8')
  console.log(`Normalized appointment ids: ${Object.keys(idMap).length} record(s) updated`)
}

run()
