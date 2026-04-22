/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '..', 'db.json')

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function toIsoDaysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(randomInt(7, 18), randomInt(0, 59), 0, 0)
  return date.toISOString()
}

function ensureArray(db, key) {
  if (!Array.isArray(db[key])) db[key] = []
}

function createLargeMockData() {
  const raw = fs.readFileSync(DB_PATH, 'utf8')
  const db = JSON.parse(raw)

  ;['appointments', 'notifications', 'medicalRecords', 'prescriptions', 'payments', 'auditLogs'].forEach(
    (key) => ensureArray(db, key)
  )

  const users = (db.users || []).filter((u) => u.role === 'patient')
  const doctors = db.doctors || []
  const schedules = db.schedules || []
  if (!users.length || !doctors.length || !schedules.length) {
    throw new Error('Thiếu users/doctors/schedules để seed dữ liệu mở rộng')
  }

  const statuses = ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show']
  const baseAppointmentCount = db.appointments.length

  for (let i = 0; i < 60; i += 1) {
    const user = pick(users)
    const doctor = pick(doctors)
    const scheduleList = schedules.filter((s) => String(s.doctorId) === String(doctor.id))
    const schedule = scheduleList.length ? pick(scheduleList) : pick(schedules)
    const status = pick(statuses)
    const id = `seed-appt-${Date.now()}-${i}`
    const createdAt = toIsoDaysAgo(randomInt(1, 40))
    db.appointments.push({
      id,
      userId: Number(user.id),
      doctorId: Number(doctor.id),
      scheduleId: Number(schedule.id),
      patientName: user.fullName,
      phone: user.phone || `09${randomInt(10000000, 99999999)}`,
      email: user.email || '',
      address: user.address || '',
      note: 'Seed dữ liệu demo',
      status,
      createdAt,
    })

    db.notifications.push({
      id: `seed-noti-${i}`,
      userId: String(doctor.id + 4),
      role: 'doctor',
      type: 'pending_appointment',
      title: `${user.fullName} vừa đặt lịch`,
      body: `Lịch hẹn ${id} với bác sĩ ${doctor.name}`,
      isRead: false,
      relatedId: id,
      createdAt,
    })

    db.auditLogs.push({
      id: `seed-audit-${i}`,
      actorId: String(doctor.id + 4),
      actorRole: 'doctor',
      action: 'seed_appointment_created',
      resourceType: 'appointments',
      resourceId: id,
      metadata: { status },
      createdAt,
    })

    if (status === 'completed') {
      const mrId = `seed-mr-${i}`
      db.medicalRecords.push({
        id: mrId,
        appointmentId: id,
        userId: String(user.id),
        doctorId: String(doctor.id),
        diagnosis: 'Khám tổng quát',
        conclusion: 'Sức khỏe ổn định',
        vitalSigns: {
          temperature: String((36 + Math.random() * 2).toFixed(1)),
          bloodPressure: `${randomInt(105, 130)}/${randomInt(70, 90)}`,
          heartRate: randomInt(70, 95),
        },
        createdAt,
      })
      db.prescriptions.push({
        id: `seed-rx-${i}`,
        medicalRecordId: mrId,
        doctorId: String(doctor.id),
        items: [{ name: 'Vitamin tổng hợp', dose: '1 viên/ngày', days: 7 }],
        advice: 'Ăn uống điều độ, ngủ đủ giấc',
        createdAt,
      })
      db.payments.push({
        id: `seed-pay-${i}`,
        appointmentId: id,
        userId: String(user.id),
        amount: randomInt(180000, 450000),
        currency: 'VND',
        method: pick(['cash', 'bank_transfer', 'ewallet']),
        status: 'paid',
        paidAt: createdAt,
        createdAt,
      })
    }
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8')
  console.log(
    `Seed mở rộng thành công: +${db.appointments.length - baseAppointmentCount} appointments và dữ liệu liên quan`
  )
}

createLargeMockData()
