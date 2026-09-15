import type { PrismaClient } from "@generated/prisma/client"
import type { DateRange } from "./period"
import type { RevenueOrder } from "./revenue"
import type { RecentOrder } from "@/types/admin"
import type { StatsInput } from "./stats"

/**
 * คำสั่ง query ของ Dashboard ทั้งหมด
 * ทุกฟังก์ชันรับ PrismaClient เข้ามา จึงชี้ไป prisma/test.db ตอนเขียน integration test ได้
 */

export async function fetchStatsInput(prisma: PrismaClient): Promise<StatsInput> {
  const [orderCount, productCount, customerCount, revenue] = await Promise.all([
    prisma.orders.count(),
    prisma.products.count(),
    prisma.customers.count(),
    prisma.orders.aggregate({ _sum: { total_amount: true } }),
  ])

  return {
    orderCount,
    productCount,
    customerCount,
    revenueSum: revenue._sum.total_amount ?? 0,
  }
}

export async function fetchRevenueOrders(
  prisma: PrismaClient,
  { from, to }: DateRange
): Promise<RevenueOrder[]> {
  return prisma.orders.findMany({
    where: { date: { gte: from, lte: to } },
    select: { date: true, total_amount: true },
    orderBy: { date: "asc" },
  })
}

export async function fetchRecentOrders(
  prisma: PrismaClient,
  limit: number
): Promise<RecentOrder[]> {
  const rows = await prisma.orders.findMany({
    take: limit,
    orderBy: [{ date: "desc" }, { id: "desc" }],
    include: { customers: { select: { name: true } } },
  })

  return rows.map((row) => ({
    id: row.id,
    date: row.date ? row.date.toISOString() : null,
    customerName: row.customers?.name ?? "ไม่ระบุชื่อ",
    status: row.status ?? "unknown",
    totalAmount: Number(row.total_amount ?? 0),
  }))
}
