import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { fetchRecentOrders } from "@/lib/admin/admin-repository"
import { parseOrdersLimit } from "@/lib/admin/admin-params"
import { API_MESSAGES, apiError, guardAdminRequest } from "@/lib/admin/api-guard"
import type { OrdersResponse } from "@/types/admin"

export async function GET(request: NextRequest) {
  const denied = await guardAdminRequest()
  if (denied) return denied

  try {
    const limit = parseOrdersLimit(request.nextUrl.searchParams)
    const orders = await fetchRecentOrders(prisma, limit)

    const body: OrdersResponse = { orders }
    return NextResponse.json(body)
  } catch (error) {
    console.error("GET /api/admin/orders failed:", error)
    return apiError(500, API_MESSAGES.serverError)
  }
}
