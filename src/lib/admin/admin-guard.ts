export const ADMIN_ROLE = "admin"

export type SessionLike = {
  user?: { id?: string; name?: string; role?: string | null } | null
} | null | undefined

/**
 * เงื่อนไขเดียวที่ตัดสินว่าเป็นแอดมินหรือไม่ ใช้ร่วมกันทั้งหน้าเว็บและ API
 * เป็นฟังก์ชันล้วน ทดสอบได้โดยไม่ต้องมี session จริง
 */
export function isAdmin(session: SessionLike): boolean {
  return session?.user?.role === ADMIN_ROLE
}
