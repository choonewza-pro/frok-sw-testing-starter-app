import { contactSchema } from "@/lib/contact-schema"
import type { ContactEmailSender } from "./email-sender"
import { isBotSubmission } from "./honeypot"

export type ContactSubmission = {
  name: string
  email: string
  subject: string
  message: string
  website?: string
}

export type ContactActionResult = {
  ok: boolean
  fieldErrors?: Record<string, string[]>
  message?: string
}

export type ContactServiceDeps = {
  /** คืน null เมื่อยังตั้งค่า env สำหรับส่งอีเมลไม่ครบ */
  createSender: () => ContactEmailSender | null
}

export const CONTACT_MESSAGES = {
  notConfigured: "ระบบยังไม่ได้ตั้งค่าการส่งอีเมล กรุณาติดต่อทีมงาน",
  sendFailed: "ไม่สามารถส่งข้อความได้ในขณะนี้ กรุณาลองใหม่ภายหลัง",
} as const

/**
 * ลำดับการทำงานของฟอร์มติดต่อทั้งหมด อยู่ในฟังก์ชันเดียวที่ทดสอบได้:
 * เช็ค honeypot -> validate -> เตรียมตัวส่ง -> ส่ง
 * ไม่มี "use server" และไม่อ่าน env เองเลย จึงเรียกจากเทสต์ได้ตรง ๆ
 */
export async function handleContactSubmission(
  input: ContactSubmission,
  { createSender }: ContactServiceDeps
): Promise<ContactActionResult> {
  // บอทกรอกช่องที่ซ่อนไว้ — ตอบ ok เพื่อไม่ให้รู้ว่าถูกจับได้ แต่ไม่ส่งอีเมล
  if (isBotSubmission(input.website)) {
    return { ok: true }
  }

  const parsed = contactSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const sender = createSender()
  if (!sender) {
    return { ok: false, message: CONTACT_MESSAGES.notConfigured }
  }

  try {
    const result = await sender(parsed.data)
    if (!result.ok) {
      console.error(`Contact email failed: ${result.status ?? "unknown"}`)
      return { ok: false, message: CONTACT_MESSAGES.sendFailed }
    }
  } catch (error) {
    console.error("Contact email threw:", error)
    return { ok: false, message: CONTACT_MESSAGES.sendFailed }
  }

  return { ok: true }
}
