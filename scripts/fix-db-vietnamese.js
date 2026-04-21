/**
 * Chuẩn hóa một số chuỗi tiếng Việt (có dấu) trong db.json — chạy một lần.
 * node scripts/fix-db-vietnamese.js
 */
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'db.json')

const REPLACEMENTS = [
  // Ghi chú lịch hẹn (seed NOTES)
  ['Kham dinh ky', 'Khám định kỳ'],
  ['Dau dau keo dai 3 ngay', 'Đau đầu kéo dài 3 ngày'],
  ['Tai kham sau dieu tri', 'Tái khám sau điều trị'],
  ['Kiem tra huyet ap', 'Kiểm tra huyết áp'],
  ['Tu van dinh duong', 'Tư vấn dinh dưỡng'],
  ['Noi me day 1 tuan', 'Nổi mề đay 1 tuần'],
  ['Ho keo dai, sot nhe', 'Ho kéo dài, sốt nhẹ'],
  ['Dau bung sau an', 'Đau bụng sau ăn'],
  ['Mat ngu, cang thang', 'Mất ngủ, căng thẳng'],
  ['Xet nghiem lai cholesterol', 'Xét nghiệm lại cholesterol'],
  // Cụm thường gặp trong hồ sơ (users)
  ['Benh da day man tinh (da dieu tri on dinh)', 'Bệnh dạ dày mạn tính (đã điều trị ổn định)'],
  [
    '01/2026: No hoi, da day: uong thuoc 2 tuan, giam trieu chung. 08/2025: Kham tong quat binh thuong.',
    '01/2026: Ợ hơi, dạ dày: uống thuốc 2 tuần, giảm triệu chứng. 08/2025: Khám tổng quát bình thường.',
  ],
  ['Thieu mau nhe, bo sung sat dinh ky', 'Thiếu máu nhẹ, bổ sung sắt định kỳ'],
  [
    '12/2025: Xet nghiem Hb thap, tu van bo sung dinh duong. Khong di ung thuoc.',
    '12/2025: Xét nghiệm Hb thấp, tư vấn bổ sung dinh dưỡng. Không dị ứng thuốc.',
  ],
  ['Dai thao duong type 2, theo doi HbA1c', 'Đái tháo đường type 2, theo dõi HbA1c'],
  [
    '02/2026: HbA1c 6.8%, dieu chinh lieu insulin. 09/2025: Chan thuong the thao co chan, da hoi phuc.',
    '02/2026: HbA1c 6.8%, điều chỉnh liều insulin. 09/2025: Chấn thương thể thao cổ chân, đã hồi phục.',
  ],
  ['Hen phe quan nhe, dung xit khi can', 'Hen phế quản nhẹ, dùng xịt khi cần'],
  [
    '11/2025: Khieu nai tho khi troi lanh, ke thuoc xit corticoid lieu thap.',
    '11/2025: Khiếu nại thở khi trời lạnh, kê thuốc xịt corticoid liều thấp.',
  ],
  [
    'Roi loan lipid mau, khong dung statin (chi dinh bac si)',
    'Rối loạn lipid máu, không dùng statin (chỉ định bác sĩ)',
  ],
  [
    '03/2026: LDL cao, tu van an kieng va van dong. 06/2025: Phau thuat tri da day (da xuat vien).',
    '03/2026: LDL cao, tư vấn ăn kiêng và vận động. 06/2025: Phẫu thuật dạ dày (đã xuất viện).',
  ],
  [
    'Nhay tim thinh thoang, ECG truoc do binh thuong',
    'Nhịp tim thỉnh thoảng, ECG trước đó bình thường',
  ],
  [
    '10/2025: Kham tim mach, loai tru benh ly nang. Khuyen nghi giam cafein.',
    '10/2025: Khám tim mạch, loại trừ bệnh lý nặng. Khuyến nghị giảm caffein.',
  ],
  ['Can thi (-2D), deo kinh hang ngay', 'Cận thị (-2D), đeo kính hàng ngày'],
  [
    '07/2025: Kham mat dinh ky. 01/2026: Viem ket mac, tra thuoc nho mat 5 ngay khoi.',
    '07/2025: Khám mắt định kỳ. 01/2026: Viêm kết mạc, tra thuốc nhỏ mắt 5 ngày khỏi.',
  ],
  [
    '04/2025: Kham dinh ky, chi so duong huyet trong gioi han. 11/2024: Cam cum, dieu tri khoi.',
    '04/2025: Khám định kỳ, chỉ số đường huyết trong giới hạn. 11/2024: Cảm cúm, điều trị khỏi.',
  ],
]

function patchValue(val) {
  if (typeof val !== 'string') return val
  let s = val
  for (const [from, to] of REPLACEMENTS) {
    if (s.includes(from)) s = s.split(from).join(to)
  }
  return s
}

function walk(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(walk)
    return
  }
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      if (typeof obj[k] === 'string') obj[k] = patchValue(obj[k])
      else walk(obj[k])
    }
  }
}

function main() {
  const raw = fs.readFileSync(dbPath, 'utf8')
  const db = JSON.parse(raw)
  walk(db)
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
  console.log('Đã cập nhật chuỗi tiếng Việt trong db.json')
}

main()
