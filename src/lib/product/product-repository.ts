import type { PrismaClient } from "@generated/prisma/client"
import type { ProductRow } from "@/types/product"
import { calcSkip } from "./product-params"

/**
 * ส่วนที่คุยกับฐานข้อมูลโดยเฉพาะ — ไม่มี logic การแสดงผลปนอยู่
 * รับ prisma client เข้ามาเป็นพารามิเตอร์ (dependency injection)
 * เพื่อให้ integration test ชี้ไปที่ไฟล์ฐานข้อมูลสำหรับทดสอบได้ โดยไม่แตะ singleton ของแอป
 */
export type ProductQuery = {
  q: string
  page: number
  pageSize: number
}

export type ProductPage = {
  rows: ProductRow[]
  total: number
}

/** เงื่อนไข where ของ Prisma — แยกออกมาเพื่อทดสอบได้ว่าคำค้นว่างแปลว่า "เอาทั้งหมด" */
export function buildProductWhere(q: string) {
  const trimmed = q.trim()
  return trimmed ? { name: { contains: trimmed } } : {}
}

/** ดึงสินค้าหนึ่งหน้า พร้อมจำนวนทั้งหมดสำหรับทำ pagination */
export async function findProductPage(
  prisma: PrismaClient,
  { q, page, pageSize }: ProductQuery
): Promise<ProductPage> {
  const where = buildProductWhere(q)

  const [rows, total] = await Promise.all([
    prisma.products.findMany({
      where,
      include: { product_images: true },
      skip: calcSkip(page, pageSize),
      take: pageSize,
    }),
    prisma.products.count({ where }),
  ])

  return { rows, total }
}
