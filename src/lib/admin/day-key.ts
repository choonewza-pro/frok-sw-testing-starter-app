export const DASHBOARD_TIME_ZONE = "Asia/Bangkok"

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: DASHBOARD_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

/**
 * แปลง Date เป็นคีย์รายวัน "YYYY-MM-DD" ตามเวลาไทย
 *
 * ทำไมต้องระบุ time zone: ถ้าใช้ toISOString() จะได้เวลา UTC
 * ออร์เดอร์ที่เกิดตอนเช้าตรู่ในไทยจะถูกนับเป็นของเมื่อวาน ทำให้กราฟเพี้ยน
 * และผลเทสต์จะเปลี่ยนไปตาม time zone ของเครื่องที่รัน
 */
export function toDayKey(date: Date): string {
  return dayKeyFormatter.format(date)
}

/** สร้างรายการคีย์รายวันตั้งแต่ from ถึง to แบบรวมปลายทั้งสองข้าง */
export function eachDayKey(from: Date, to: Date): string[] {
  const keys: string[] = []
  const cursor = new Date(from)
  cursor.setHours(12, 0, 0, 0) // กันปัญหา DST และการปัดวัน

  const lastKey = toDayKey(to)
  for (let guard = 0; guard < 400; guard += 1) {
    const key = toDayKey(cursor)
    keys.push(key)
    if (key >= lastKey) break
    cursor.setDate(cursor.getDate() + 1)
  }

  return keys
}
