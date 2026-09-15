import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { fetchRevenueOrders } from "@/lib/admin/admin-repository"
import { parsePeriod, periodRange } from "@/lib/admin/period"
import { buildRevenueSeries, sumRevenue } from "@/lib/admin/revenue"
import { API_MESSAGES, apiError, guardAdminRequest } from "@/lib/admin/api-guard"
import type { RevenueResponse } from "@/types/admin"

export async function GET(request: NextRequest) {
  const denied = await guardAdminRequest()
  if (denied) return denied

  try {
    const period = parsePeriod(request.nextUrl.searchParams.get("period"))
    const range = periodRange(period)

    const orders = await fetchRevenueOrders(prisma, range)
    const points = buildRevenueSeries(orders, range)

    const body: RevenueResponse = { period, points, total: sumRevenue(points) }
    return NextResponse.json(body)
  } catch (error) {
    console.error("GET /api/admin/revenue failed:", error)
    return apiError(500, API_MESSAGES.serverError)
  }
}
