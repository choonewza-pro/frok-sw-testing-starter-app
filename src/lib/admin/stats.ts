export type StatsInput = {
  orderCount: number
  productCount: number
  customerCount: number
  revenueSum: number | null
}

export type DashboardStats = {
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  totalRevenue: number
  averageOrderValue: number
}

/**
 * ประกอบตัวเลขสรุปจากผลนับดิบที่ได้จากฐานข้อมูล
 * แยกออกมาเป็นฟังก์ชันล้วน เพื่อทดสอบเคสหารด้วยศูนย์ได้โดยไม่ต้องมี DB
 */
export function calcDashboardStats({
  orderCount,
  productCount,
  customerCount,
  revenueSum,
}: StatsInput): DashboardStats {
  const totalRevenue = revenueSum ?? 0

  return {
    totalOrders: orderCount,
    totalProducts: productCount,
    totalCustomers: customerCount,
    totalRevenue,
    // ยังไม่มีออร์เดอร์ = 0 ไม่ใช่ NaN
    averageOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
  }
}
