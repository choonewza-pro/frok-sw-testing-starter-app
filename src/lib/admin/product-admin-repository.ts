import type { PrismaClient } from "@generated/prisma/client"
import type { AdminCategory, AdminProduct } from "@/types/admin"
import type { ProductFormValues } from "./product-schema"

/** เงื่อนไขค้นหา แยกออกมาเพื่อทดสอบได้ว่าคำค้นว่างแปลว่า "เอาทั้งหมด" */
export function buildAdminProductWhere(search: string) {
  const trimmed = search.trim()
  return trimmed ? { name: { contains: trimmed } } : {}
}

/** แปลงแถวจาก Prisma เป็นรูปแบบที่ API ส่งออก — price เป็น number เสมอ */
type ProductRowWithCategory = {
  id: number
  name: string | null
  description: string | null
  price: number | null
  category_id: number | null
  categories: { name: string | null } | null
}

export function toAdminProduct(row: ProductRowWithCategory): AdminProduct {
  return {
    id: row.id,
    name: row.name ?? "",
    description: row.description ?? "",
    // Prisma Decimal/Float -> number ก่อนส่งข้าม network
    price: Number(row.price ?? 0),
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? null,
  }
}

export async function findAdminProducts(
  prisma: PrismaClient,
  { search, page, pageSize }: { search: string; page: number; pageSize: number }
): Promise<{ products: AdminProduct[]; total: number }> {
  const where = buildAdminProductWhere(search)

  const [rows, total] = await Promise.all([
    prisma.products.findMany({
      where,
      include: { categories: { select: { name: true } } },
      orderBy: { id: "desc" },
      skip: Math.max(0, (page - 1) * pageSize),
      take: pageSize,
    }),
    prisma.products.count({ where }),
  ])

  return { products: rows.map(toAdminProduct), total }
}

export async function createProduct(
  prisma: PrismaClient,
  values: ProductFormValues
): Promise<AdminProduct> {
  const row = await prisma.products.create({
    data: {
      name: values.name,
      description: values.description || null,
      price: values.price,
      category_id: values.categoryId,
    },
    include: { categories: { select: { name: true } } },
  })

  return toAdminProduct(row)
}

export async function updateProduct(
  prisma: PrismaClient,
  id: number,
  values: ProductFormValues
): Promise<AdminProduct> {
  const row = await prisma.products.update({
    where: { id },
    data: {
      name: values.name,
      description: values.description || null,
      price: values.price,
      category_id: values.categoryId,
    },
    include: { categories: { select: { name: true } } },
  })

  return toAdminProduct(row)
}

export async function deleteProduct(prisma: PrismaClient, id: number): Promise<void> {
  await prisma.products.delete({ where: { id } })
}

export async function findProductById(prisma: PrismaClient, id: number) {
  return prisma.products.findUnique({ where: { id } })
}

/** นับจำนวนรายการสั่งซื้อที่อ้างถึงสินค้านี้ ใช้กันการลบ */
export async function countOrderItemsForProduct(
  prisma: PrismaClient,
  productId: number
): Promise<number> {
  return prisma.order_items.count({ where: { product_id: productId } })
}

export async function findCategories(prisma: PrismaClient): Promise<AdminCategory[]> {
  const rows = await prisma.categories.findMany({ orderBy: { id: "asc" } })
  return rows.map((row) => ({ id: row.id, name: row.name ?? "" }))
}
