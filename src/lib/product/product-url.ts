/**
 * สร้าง URL ของหน้าสินค้าจากคำค้นและเลขหน้า
 * ตัดพารามิเตอร์ที่เป็นค่า default ออก เพื่อให้ URL สะอาด
 */
export function buildProductUrl(q: string, page: number): string {
  const params = new URLSearchParams()

  const trimmed = q.trim()
  if (trimmed) params.set("q", trimmed)
  if (page > 1) params.set("page", String(page))

  const qs = params.toString()
  return qs ? `/product?${qs}` : "/product"
}
