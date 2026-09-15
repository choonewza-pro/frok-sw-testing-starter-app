"use server"

import { contactSchema } from "@/lib/contact-schema"

export type ContactActionResult = {
  ok: boolean
  fieldErrors?: Record<string, string[]>
  message?: string
}

export async function submitContactForm(input: {
  name: string
  email: string
  subject: string
  message: string
  website?: string
}): Promise<ContactActionResult> {
  if (input.website?.trim() !== "") {
    return { ok: true }
  }

  const parsed = contactSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { name, email, subject, message } = parsed.data

  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.CONTACT_FROM_EMAIL
  const toEmail = process.env.CONTACT_TO_EMAIL
  if (!apiKey || !fromEmail || !toEmail) {
    return { ok: false, message: "ระบบยังไม่ได้ตั้งค่าการส่งอีเมล กรุณาติดต่อทีมงาน" }
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      replyTo: email,
      subject: `[ติดต่อเว็บไซต์] ${subject}`,
      text: `ชื่อ: ${name}\nอีเมล: ${email}\nหัวข้อ: ${subject}\n\n${message}`,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) {
    console.error(`Contact email failed: ${res.status} ${res.statusText}`)
    return {
      ok: false,
      message: "ไม่สามารถส่งข้อความได้ในขณะนี้ กรุณาลองใหม่ภายหลัง",
    }
  }

  return { ok: true }
}
