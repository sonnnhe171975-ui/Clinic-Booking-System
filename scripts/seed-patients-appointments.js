/**
 * One-off: enrich patients, add users 7-12, regenerate appointments from schedule.currentSlot
 * Run: node scripts/seed-patients-appointments.js
 */
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'db.json')

const NOTES = [
  'Khám định kỳ',
  'Đau đầu kéo dài 3 ngày',
  'Tái khám sau điều trị',
  'Kiểm tra huyết áp',
  'Tư vấn dinh dưỡng',
  'Nổi mề đay 1 tuần',
  'Ho kéo dài, sốt nhẹ',
  'Đau bụng sau ăn',
  'Mất ngủ, căng thẳng',
  'Xét nghiệm lại cholesterol',
]

const NEW_PATIENTS = [
  {
    id: '7',
    username: 'user7',
    password: '123456',
    fullName: 'Le Van Minh',
    role: 'patient',
    email: 'levanminh@gmail.com',
    phone: '0911110007',
    address: '78 Bach Dang, Hai Chau, Da Nang',
    dateOfBirth: '1992-01-10',
    gender: 'male',
    underlyingConditions: 'Bệnh dạ dày mạn tính (đã điều trị ổn định)',
    medicalHistory:
      '01/2026: Ợ hơi, dạ dày: uống thuốc 2 tuần, giảm triệu chứng. 08/2025: Khám tổng quát bình thường.',
  },
  {
    id: '8',
    username: 'user8',
    password: '123456',
    fullName: 'Pham Thi Lan',
    role: 'patient',
    email: 'phamthilan@gmail.com',
    phone: '0911110008',
    address: '15 Nguyen Van Troi, Thanh Khe, Da Nang',
    dateOfBirth: '1996-11-05',
    gender: 'female',
    underlyingConditions: 'Thiếu máu nhẹ, bổ sung sắt định kỳ',
    medicalHistory:
      '12/2025: Xét nghiệm Hb thấp, tư vấn bổ sung dinh dưỡng. Không dị ứng thuốc.',
  },
  {
    id: '9',
    username: 'user9',
    password: '123456',
    fullName: 'Hoang Van Tung',
    role: 'patient',
    email: 'hoangvantung@gmail.com',
    phone: '0911110009',
    address: '220 Nguyen Huu Tho, Lien Chieu, Da Nang',
    dateOfBirth: '1985-04-28',
    gender: 'male',
    underlyingConditions: 'Đái tháo đường type 2, theo dõi HbA1c',
    medicalHistory:
      '02/2026: HbA1c 6.8%, điều chỉnh liều insulin. 09/2025: Chấn thương thể thao cổ chân, đã hồi phục.',
  },
  {
    id: '10',
    username: 'user10',
    password: '123456',
    fullName: 'Vo Thi Mai',
    role: 'patient',
    email: 'vothimai@gmail.com',
    phone: '0911110010',
    address: '5 Tran Phu, Son Tra, Da Nang',
    dateOfBirth: '2001-08-14',
    gender: 'female',
    underlyingConditions: 'Hen phế quản nhẹ, dùng xịt khi cần',
    medicalHistory:
      '11/2025: Khiếu nại thở khi trời lạnh, kê thuốc xịt corticoid liều thấp.',
  },
  {
    id: '11',
    username: 'user11',
    password: '123456',
    fullName: 'Dang Quoc Bao',
    role: 'patient',
    email: 'dangquocbao@gmail.com',
    phone: '0911110011',
    address: '99 Le Duan, Hai Chau, Da Nang',
    dateOfBirth: '1990-12-20',
    gender: 'male',
    underlyingConditions: 'Rối loạn lipid máu, không dùng statin (chỉ định bác sĩ)',
    medicalHistory:
      '03/2026: LDL cao, tư vấn ăn kiêng và vận động. 06/2025: Phẫu thuật dạ dày (đã xuất viện).',
  },
  {
    id: '12',
    username: 'user12',
    password: '123456',
    fullName: 'Bui Thi Kim Anh',
    role: 'patient',
    email: 'buikimanh@gmail.com',
    phone: '0911110012',
    address: '40 Hung Vuong, Hai Chau, Da Nang',
    dateOfBirth: '1994-02-02',
    gender: 'female',
    underlyingConditions: 'Nhịp tim thỉnh thoảng, ECG trước đó bình thường',
    medicalHistory:
      '10/2025: Khám tim mạch, loại trừ bệnh lý nặng. Khuyến nghị giảm caffein.',
  },
]

function main() {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'))

  const u4 = db.users.find((u) => String(u.id) === '4')
  if (u4) {
    u4.dateOfBirth = '1999-09-09'
    u4.gender = 'male'
    u4.underlyingConditions = 'Cận thị (-2D), đeo kính hàng ngày'
    u4.medicalHistory =
      '07/2025: Khám mắt định kỳ. 01/2026: Viêm kết mạc, tra thuốc nhỏ mắt 5 ngày khỏi.'
  }

  for (const p of NEW_PATIENTS) {
    if (db.users.some((u) => String(u.id) === String(p.id))) continue
    db.users.push(p)
  }

  const patientPool = db.users.filter((u) => u.role === 'patient')
  const poolIds = patientPool.map((u) => Number(u.id)).sort((a, b) => a - b)

  const sortedSchedules = [...db.schedules].sort((a, b) => Number(a.id) - Number(b.id))
  const appointments = []
  let seq = 1
  let hash = 0

  for (const sch of sortedSchedules) {
    const n = Math.min(Number(sch.currentSlot) || 0, Number(sch.maxSlot) || 0)
    const doctorId = Number(sch.doctorId)
    const scheduleId = Number(sch.id)
    const dateStr = sch.date
    for (let i = 0; i < n; i++) {
      hash++
      const userId = poolIds[hash % poolIds.length]
      const user = patientPool.find((u) => Number(u.id) === userId)
      if (!user) continue
      const created = `${dateStr}T${String(8 + (hash % 8)).padStart(2, '0')}:${String((hash * 7) % 60).padStart(2, '0')}:00.000Z`
      appointments.push({
        id: String(seq++),
        userId,
        doctorId,
        scheduleId,
        patientName: user.fullName,
        phone: user.phone,
        email: user.email,
        address: user.address,
        note: NOTES[hash % NOTES.length],
        createdAt: created,
      })
    }
  }

  db.appointments = appointments

  for (const sch of db.schedules) {
    const sid = Number(sch.id)
    const cnt = appointments.filter((a) => Number(a.scheduleId) === sid).length
    sch.currentSlot = cnt
    const max = Number(sch.maxSlot) || 0
    sch.status = cnt >= max && max > 0 ? 'full' : 'available'
  }

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
  console.log('Patients in pool:', poolIds.length, poolIds.join(','))
  console.log('Appointments:', appointments.length)
}

main()
