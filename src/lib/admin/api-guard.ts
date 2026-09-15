import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { isAdmin } from "./admin-guard"
import type { ApiErrorResponse } from "@/types/admin"

export const API_MESSAGES = {
  unauthenticated: "กรุณาเข้าสู่ระบบ",
  forbidden: "ต้องเป็นผู้ดูแลระบบเท่านั้น",
  serverError: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์",
} as const

export function apiError(status: number, error: string, fieldErrors?: Record<string, string[]>) {
  const body: ApiErrorResponse = fieldErrors ? { error, fieldErrors } : { error }
  return NextResponse.json(body, { status })
}

/**
 * ด่านเดียวที่ทุก Route Handler ของ Admin ต้องผ่าน
 * คืน NextResponse เมื่อไม่ผ่าน และคืน null เมื่อผ่าน — ให้ handler เขียนสั้น ๆ ว่า
 *   const denied = await guardAdminRequest(); if (denied) return denied
 */
export async function guardAdminRequest(): Promise<NextResponse | null> {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) return apiError(401, API_MESSAGES.unauthenticated)
  if (!isAdmin(session)) return apiError(403, API_MESSAGES.forbidden)

  return null
}
