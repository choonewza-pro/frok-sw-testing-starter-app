import type { CartItem } from "@/types/cart"

/**
 * Logic ของตะกร้าสินค้าทั้งหมด เขียนเป็น pure function:
 * รับ state เข้า คืน state ใหม่ออกไป ไม่แก้ของเดิม ไม่แตะ React / zustand / localStorage
 * ทำให้ unit test ได้โดยตรง และ store ด้านบนเหลือหน้าที่แค่ "เก็บ state"
 */

/** เพิ่มสินค้าลงตะกร้า ถ้ามีอยู่แล้วให้บวกจำนวนเพิ่ม */
export function addItem(items: CartItem[], item: CartItem): CartItem[] {
  if (item.qty <= 0) return items

  const exists = items.some((i) => i.productId === item.productId)
  if (!exists) return [...items, { ...item }]

  return items.map((i) =>
    i.productId === item.productId ? { ...i, qty: i.qty + item.qty } : i
  )
}

/** ลบสินค้าออกจากตะกร้าตามรหัสสินค้า */
export function removeItem(items: CartItem[], productId: number): CartItem[] {
  return items.filter((i) => i.productId !== productId)
}

/** แก้จำนวนสินค้า ถ้าเหลือ 0 หรือติดลบให้ถือว่าลบออกจากตะกร้า */
export function updateQty(
  items: CartItem[],
  productId: number,
  qty: number
): CartItem[] {
  if (qty <= 0) return removeItem(items, productId)

  return items.map((i) => (i.productId === productId ? { ...i, qty } : i))
}

/** จำนวนชิ้นรวมทุกรายการ */
export function totalItems(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0)
}

/** ราคารวมทุกรายการ */
export function totalPrice(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty * item.price, 0)
}

/** ราคารวมของรายการเดียว */
export function lineTotal(item: CartItem): number {
  return item.price * item.qty
}
