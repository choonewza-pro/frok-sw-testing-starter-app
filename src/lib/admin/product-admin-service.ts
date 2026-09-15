import type { AdminProduct } from "@/types/admin"
import { productSchema, type ProductFormValues } from "./product-schema"

export const PRODUCT_MESSAGES = {
  notFound: "ไม่พบสินค้าที่ต้องการ",
  invalidId: "รหัสสินค้าไม่ถูกต้อง",
  hasOrderItems:
    "ลบไม่ได้ เพราะสินค้านี้ถูกใช้งานอยู่ในรายการสั่งซื้อ กรุณาลบรายการสั่งซื้อที่เกี่ยวข้องก่อน",
  invalidInput: "ข้อมูลไม่ถูกต้อง",
} as const

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; fieldErrors?: Record<string, string[]> }

/**
 * ทุก dependency ถูกส่งเข้ามาเป็นฟังก์ชัน ไม่ได้ import prisma ตรง ๆ
 * ทำให้ unit test ส่งของปลอมเข้ามาแล้วตรวจได้ว่า "ลบถูกเรียกหรือไม่ถูกเรียก"
 */
export type SaveProductDeps = {
  save: (values: ProductFormValues) => Promise<AdminProduct>
}

export type DeleteProductDeps = {
  findProductById: (id: number) => Promise<{ id: number; name: string | null } | null>
  countOrderItems: (productId: number) => Promise<number>
  deleteProduct: (id: number) => Promise<void>
}

/** ตรวจข้อมูลด้วย schema เดียวกับฝั่ง Client แล้วค่อยบันทึก */
export async function saveProduct(
  input: unknown,
  { save }: SaveProductDeps
): Promise<ServiceResult<AdminProduct>> {
  const parsed = productSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: PRODUCT_MESSAGES.invalidInput,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  return { ok: true, data: await save(parsed.data) }
}

/**
 * ลบสินค้าโดยตรวจก่อนว่ามีรายการสั่งซื้ออ้างถึงอยู่หรือไม่
 *
 * schema ตั้ง order_items.product_id เป็น onDelete: NoAction อยู่แล้ว
 * ถ้าปล่อยให้ลบตรง ๆ ฐานข้อมูลจะโยน foreign key error ออกมาเป็นข้อความที่ผู้ใช้อ่านไม่รู้เรื่อง
 * จึงเช็คก่อนแล้วตอบด้วยข้อความภาษาไทยที่บอกสาเหตุชัดเจน
 */
export async function deleteProductSafely(
  id: number,
  { findProductById, countOrderItems, deleteProduct }: DeleteProductDeps
): Promise<ServiceResult<{ id: number }>> {
  const product = await findProductById(id)
  if (!product) {
    return { ok: false, status: 404, error: PRODUCT_MESSAGES.notFound }
  }

  const orderItemCount = await countOrderItems(id)
  if (orderItemCount > 0) {
    return { ok: false, status: 409, error: PRODUCT_MESSAGES.hasOrderItems }
  }

  await deleteProduct(id)
  return { ok: true, data: { id } }
}
