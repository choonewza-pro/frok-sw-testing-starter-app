import { z } from "zod"

/**
 * กติกาเดียวของสินค้า ใช้ร่วมกันระหว่างฟอร์มฝั่ง Client และ Route Handler
 * ถ้าแก้ที่นี่ที่เดียว ทั้งสองฝั่งเปลี่ยนตามพร้อมกัน ไม่มีทางหลุดไม่ตรงกัน
 */
export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อสินค้า")
    .max(255, "ชื่อสินค้าต้องไม่เกิน 255 ตัวอักษร"),
  description: z
    .string()
    .trim()
    .max(2000, "รายละเอียดต้องไม่เกิน 2000 ตัวอักษร")
    .optional()
    .or(z.literal("")),
  price: z
    .number("กรุณากรอกราคาเป็นตัวเลข")
    .positive("ราคาต้องมากกว่า 0")
    .max(10_000_000, "ราคาสูงเกินไป"),
  categoryId: z.number("กรุณาเลือกหมวดหมู่").int("หมวดหมู่ไม่ถูกต้อง").positive("กรุณาเลือกหมวดหมู่"),
})

export type ProductFormValues = z.infer<typeof productSchema>

/**
 * แปลงค่าที่ได้จาก <input> ซึ่งเป็น string เสมอ ให้เป็นตัวเลข
 * คืน null เมื่อแปลงไม่ได้ เพื่อให้ Zod เป็นคนรายงาน error แทนที่จะได้ NaN หลุดเข้าไป
 */
export function parseNumberInput(value: string | number | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value !== "string") return null

  const cleaned = value.replace(/,/g, "").trim()
  if (cleaned === "") return null

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}
