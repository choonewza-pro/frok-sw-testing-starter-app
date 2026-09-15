"use server"

import { getContactEmailConfig } from "@/lib/contact/contact-config"
import {
  handleContactSubmission,
  type ContactActionResult,
  type ContactSubmission,
} from "@/lib/contact/contact-service"
import { createResendEmailSender } from "@/lib/contact/email-sender"

export type { ContactActionResult }

/**
 * Server Action เหลือหน้าที่แค่ประกอบ dependency ของจริงแล้วส่งต่อ
 * logic ทั้งหมดอยู่ใน handleContactSubmission ซึ่งทดสอบได้โดยไม่ต้องมี Next.js runtime
 */
export async function submitContactForm(
  input: ContactSubmission
): Promise<ContactActionResult> {
  return handleContactSubmission(input, {
    createSender: () => {
      const config = getContactEmailConfig()
      return config ? createResendEmailSender(config) : null
    },
  })
}
