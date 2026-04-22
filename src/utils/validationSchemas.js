import { z } from 'zod'

const phoneDigitsSchema = z
  .string()
  .transform((value) => String(value || '').replace(/\D/g, ''))
  .refine((digits) => digits.length >= 9 && digits.length <= 11, {
    message: 'Số điện thoại không hợp lệ (9–11 chữ số)',
  })

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên'),
    username: z.string().trim().min(3, 'Tên đăng nhập tối thiểu 3 ký tự'),
    email: z.string().trim().email('Email không hợp lệ'),
    phone: phoneDigitsSchema,
    password: z.string().trim().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    confirmPassword: z.string().trim().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu xác nhận không khớp',
  })

export const bookingSchema = z.object({
  patientName: z.string().trim().min(1, 'Vui lòng nhập tên bệnh nhân'),
  phone: phoneDigitsSchema,
  email: z.string().trim().email('Email không hợp lệ').or(z.literal('')),
  address: z.string().trim().optional(),
  note: z.string().trim().optional(),
  selectedScheduleId: z.string().trim().min(1, 'Vui lòng chọn lịch khám'),
})

export function getFirstZodError(error, fallback = 'Dữ liệu không hợp lệ') {
  if (!error || !Array.isArray(error.issues) || error.issues.length === 0) return fallback
  return error.issues[0].message || fallback
}
