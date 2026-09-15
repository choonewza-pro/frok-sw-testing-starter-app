export const THAI_LOCALE = "th-TH"

/**
 * จัดรูปแบบราคาแบบง่าย ใช้ในหน้าร้านและตะกร้า
 * แยกออกมาเป็นฟังก์ชันเดียว แทนการเรียก .toFixed(2) กระจายตาม component
 */
export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return "0.00"
  return value.toFixed(2)
}

const currencyFormatter = new Intl.NumberFormat(THAI_LOCALE, {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 2,
})

/** จัดรูปแบบเป็นสกุลเงินบาทเต็มรูปแบบ ใช้ในหน้า Admin */
export function formatTHB(value: number): string {
  if (!Number.isFinite(value)) return currencyFormatter.format(0)
  return currencyFormatter.format(value)
}

const compactNumberFormatter = new Intl.NumberFormat(THAI_LOCALE)

/** จัดรูปแบบจำนวนเต็ม เช่น จำนวนออร์เดอร์ */
export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "0"
  return compactNumberFormatter.format(value)
}

const dateTimeFormatter = new Intl.DateTimeFormat(THAI_LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
})

const dateFormatter = new Intl.DateTimeFormat(THAI_LOCALE, {
  day: "numeric",
  month: "short",
})

/** แสดงวันที่พร้อมเวลาแบบไทย คืน "-" เมื่อไม่มีค่า */
export function formatDateTimeTH(value: string | Date | null | undefined): string {
  const date = toDate(value)
  if (!date) return "-"
  return dateTimeFormatter.format(date)
}

/** แสดงวันแบบสั้นสำหรับแกน X ของกราฟ เช่น "15 ก.ย." */
export function formatShortDateTH(value: string | Date | null | undefined): string {
  const date = toDate(value)
  if (!date) return "-"
  return dateFormatter.format(date)
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
