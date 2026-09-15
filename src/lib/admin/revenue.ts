import { eachDayKey, toDayKey } from "./day-key"
import type { DateRange } from "./period"

export type RevenueOrder = {
  date: Date | null
  total_amount: number | null
}

export type RevenuePoint = {
  date: string
  revenue: number
}

/**
 * รวมยอดขายเป็นรายวัน และเติมวันที่ไม่มีออร์เดอร์ด้วย 0
 *
 * ต้องเติมวันที่ยอด 0 ด้วย ไม่งั้นกราฟจะข้ามวันแล้วดูเหมือนขายได้ทุกวัน
 * ฟังก์ชันนี้ไม่แตะฐานข้อมูลและไม่อ่านนาฬิกา ทดสอบได้ตรง ๆ
 */
export function buildRevenueSeries(
  orders: RevenueOrder[],
  { from, to }: DateRange
): RevenuePoint[] {
  const totals = new Map<string, number>()

  for (const order of orders) {
    if (!order.date) continue
    const key = toDayKey(order.date)
    totals.set(key, (totals.get(key) ?? 0) + (order.total_amount ?? 0))
  }

  return eachDayKey(from, to).map((date) => ({
    date,
    revenue: totals.get(date) ?? 0,
  }))
}

/** ยอดรวมของทั้งกราฟ ใช้แสดงใต้หัวข้อ */
export function sumRevenue(points: RevenuePoint[]): number {
  return points.reduce((sum, point) => sum + point.revenue, 0)
}
