import { z } from "zod"

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร")
    .max(100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
  email: z
    .string()
    .trim()
    .min(1, "กรุณากรอกอีเมล")
    .pipe(z.email("รูปแบบอีเมลไม่ถูกต้อง")),
  subject: z
    .string()
    .trim()
    .min(3, "หัวข้อต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(150, "หัวข้อต้องไม่เกิน 150 ตัวอักษร"),
  message: z
    .string()
    .trim()
    .min(10, "ข้อความต้องมีอย่างน้อย 10 ตัวอักษร")
    .max(2000, "ข้อความต้องไม่เกิน 2000 ตัวอักษร"),
})

export type ContactFormValues = z.infer<typeof contactSchema>
