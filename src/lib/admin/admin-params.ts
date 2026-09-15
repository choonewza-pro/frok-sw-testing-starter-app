export const ADMIN_PRODUCT_PAGE_SIZE = 10
export const DEFAULT_RECENT_ORDERS_LIMIT = 5
export const MAX_RECENT_ORDERS_LIMIT = 50

export type AdminProductQuery = {
  search: string
  page: number
}

/** อ่านค่าค้นหาและเลขหน้าจาก URL ให้ได้ค่าที่ใช้งานได้เสมอ */
export function parseAdminProductQuery(params: URLSearchParams): AdminProductQuery {
  return {
    search: (params.get("search") ?? "").trim(),
    page: parsePositiveInt(params.get("page"), 1),
  }
}

/** อ่าน limit ของ recent orders พร้อมกันค่าเกินพิกัด */
export function parseOrdersLimit(params: URLSearchParams): number {
  const limit = parsePositiveInt(params.get("limit"), DEFAULT_RECENT_ORDERS_LIMIT)
  return Math.min(limit, MAX_RECENT_ORDERS_LIMIT)
}

/** อ่าน id จาก path parameter คืน null เมื่อไม่ใช่จำนวนเต็มบวก */
export function parseRouteId(value: string | undefined): number | null {
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return parsed
}
