import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { fetchStatsInput } from "@/lib/admin/admin-repository"
import { calcDashboardStats } from "@/lib/admin/stats"
import { API_MESSAGES, apiError, guardAdminRequest } from "@/lib/admin/api-guard"
import type { StatsResponse } from "@/types/admin"

export async function GET() {
  const denied = await guardAdminRequest()
  if (denied) return denied

  try {
    const input = await fetchStatsInput(prisma)
    const body: StatsResponse = calcDashboardStats(input)
    return NextResponse.json(body)
  } catch (error) {
    console.error("GET /api/admin/stats failed:", error)
    return apiError(500, API_MESSAGES.serverError)
  }
}
