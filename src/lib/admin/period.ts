/** ช่วงเวลาที่ Dashboard รองรับ */
export const PERIODS = ["7d", "30d", "90d"] as const

export type Period = (typeof PERIODS)[number]

export const DEFAULT_PERIOD: Period = "30d"

const PERIOD_DAYS: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
}

/** แปลงค่าที่รับมาจาก query string ให้เป็น Period ที่ถูกต้องเสมอ */
export function parsePeriod(value: string | null | undefined): Period {
  return PERIODS.includes(value as Period) ? (value as Period) : DEFAULT_PERIOD
}

export function periodToDays(period: Period): number {
  return PERIOD_DAYS[period]
}

export type DateRange = { from: Date; to: Date }

/**
 * คำนวณช่วงวันที่ของ period โดยนับรวมวันนี้ด้วย
 * รับ `now` เข้ามาเป็นพารามิเตอร์ เพื่อให้เทสต์กำหนดเวลาได้เองโดยไม่ต้อง mock นาฬิกา
 */
export function periodRange(period: Period, now: Date = new Date()): DateRange {
  const days = periodToDays(period)
  const to = new Date(now)
  const from = new Date(now)
  from.setDate(from.getDate() - (days - 1))
  from.setHours(0, 0, 0, 0)
  return { from, to }
}
