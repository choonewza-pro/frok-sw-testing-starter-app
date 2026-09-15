export const PRODUCT_PAGE_SIZE = 10

export type ProductSearchParams = {
  q: string
  page: number
}

type RawSearchParams = { [key: string]: string | string[] | undefined }

/**
 * แปลง searchParams ดิบจาก URL ให้เป็นค่าที่ใช้ query ได้เสมอ
 * pure function — รับ object เข้า คืน object ออก ทดสอบได้โดยไม่ต้องมี request จริง
 */
export function parseProductSearchParams(
  params: RawSearchParams = {}
): ProductSearchParams {
  return {
    q: parseQuery(params.q),
    page: parsePage(params.page),
  }
}

function parseQuery(value: string | string[] | undefined): string {
  if (typeof value !== "string") return ""
  return value.trim()
}

function parsePage(value: string | string[] | undefined): number {
  if (typeof value !== "string") return 1
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return 1
  return Math.max(1, parsed)
}

/** จำนวนหน้าทั้งหมด อย่างน้อย 1 หน้าเสมอ แม้ไม่มีสินค้าเลย */
export function calcTotalPages(total: number, pageSize: number): number {
  if (pageSize <= 0) return 1
  return Math.max(1, Math.ceil(total / pageSize))
}

/** ตำแหน่งเริ่มต้นของหน้า สำหรับส่งให้ Prisma `skip` */
export function calcSkip(page: number, pageSize: number): number {
  return Math.max(0, (page - 1) * pageSize)
}
