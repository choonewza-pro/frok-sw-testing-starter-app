import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { isAdmin } from "./admin-guard"

/**
 * ด่านตรวจสิทธิ์ของหน้า Admin ทุกหน้า
 * ยังไม่ล็อกอิน -> ส่งไปหน้า login, ล็อกอินแล้วแต่ไม่ใช่แอดมิน -> ส่งกลับหน้าร้าน
 * (ใช้ redirect แทนการแสดงข้อความ เพื่อไม่บอกใบ้ว่ามีหน้านี้อยู่)
 */
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect("/login")
  if (!isAdmin(session)) redirect("/")

  return session
}
