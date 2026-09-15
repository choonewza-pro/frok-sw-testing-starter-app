/**
 * จัดรูปแบบราคาเป็นสกุลเงินบาท
 * แยกออกมาเป็นฟังก์ชันเดียว แทนการเรียก .toFixed(2) กระจายตาม component
 */
export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return "0.00"
  return value.toFixed(2)
}
