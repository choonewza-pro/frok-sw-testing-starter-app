import { z } from "zod"

/**
 * กติกาการตรวจฟอร์มเข้าระบบ/สมัครสมาชิก
 * แยกออกจาก component (แบบเดียวกับ contact-schema) เพื่อให้ทดสอบกฎแต่ละข้อได้
 * โดยไม่ต้อง render ฟอร์มขึ้นมาก่อน
 */

/** ต้องตรงกับ minPasswordLength ใน src/lib/auth.ts */
export const MIN_PASSWORD_LENGTH = 8

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "กรุณากรอกอีเมล")
    .pipe(z.email("รูปแบบอีเมลไม่ถูกต้อง")),
  password: z
    .string()
    .min(1, "กรุณากรอกรหัสผ่าน")
    .min(MIN_PASSWORD_LENGTH, `รหัสผ่านต้องมีอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "กรุณากรอกชื่อ")
      .min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร")
      .max(50, "ชื่อต้องไม่เกิน 50 ตัวอักษร"),
    email: z
      .string()
      .min(1, "กรุณากรอกอีเมล")
      .pipe(z.email("รูปแบบอีเมลไม่ถูกต้อง")),
    password: z
      .string()
      .min(1, "กรุณากรอกรหัสผ่าน")
      .min(MIN_PASSWORD_LENGTH, `รหัสผ่านต้องมีอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  })

export type RegisterFormValues = z.infer<typeof registerSchema>
