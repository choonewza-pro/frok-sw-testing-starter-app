export type ContactEmailConfig = {
  apiKey: string
  fromEmail: string
  toEmail: string
}

/**
 * อ่านค่า config การส่งอีเมลจาก environment
 * รับ env เข้ามาเป็นพารามิเตอร์ (ค่า default คือ process.env)
 * เพื่อให้ทดสอบเคส "ตั้งค่าไม่ครบ" ได้โดยไม่ต้องไปแก้ process.env จริง
 */
export function getContactEmailConfig(
  env: NodeJS.ProcessEnv = process.env
): ContactEmailConfig | null {
  const apiKey = env.RESEND_API_KEY
  const fromEmail = env.CONTACT_FROM_EMAIL
  const toEmail = env.CONTACT_TO_EMAIL

  if (!apiKey || !fromEmail || !toEmail) return null

  return { apiKey, fromEmail, toEmail }
}
