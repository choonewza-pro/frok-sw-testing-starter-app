import type { ContactFormValues } from "@/lib/contact-schema"
import type { ContactEmailConfig } from "./contact-config"

export const RESEND_ENDPOINT = "https://api.resend.com/emails"

/**
 * สัญญา (port) ของตัวส่งอีเมล — โค้ดที่เรียกใช้รู้จักแค่ interface นี้
 * production ใช้ createResendEmailSender ส่วนเทสต์ส่งตัวปลอมเข้ามาแทนได้
 */
export type ContactEmailSender = (
  values: ContactFormValues
) => Promise<{ ok: boolean; status?: number }>

/** ประกอบเนื้อหาอีเมลจากข้อมูลในฟอร์ม — pure function ทดสอบข้อความที่ได้ได้ตรง ๆ */
export function buildContactEmailPayload(
  values: ContactFormValues,
  config: ContactEmailConfig
) {
  return {
    from: config.fromEmail,
    to: [config.toEmail],
    replyTo: values.email,
    subject: `[ติดต่อเว็บไซต์] ${values.subject}`,
    text: `ชื่อ: ${values.name}\nอีเมล: ${values.email}\nหัวข้อ: ${values.subject}\n\n${values.message}`,
  }
}

/** ตัวส่งอีเมลของจริง ผ่าน Resend REST API (ไม่ใช้ SDK) */
export function createResendEmailSender(
  config: ContactEmailConfig,
  fetchImpl: typeof fetch = fetch
): ContactEmailSender {
  return async (values) => {
    const response = await fetchImpl(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildContactEmailPayload(values, config)),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })

    return { ok: response.ok, status: response.status }
  }
}
