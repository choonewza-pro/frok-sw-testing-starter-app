import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { findCategories } from "@/lib/admin/product-admin-repository"
import { API_MESSAGES, apiError, guardAdminRequest } from "@/lib/admin/api-guard"
import type { CategoriesResponse } from "@/types/admin"

export async function GET() {
  const denied = await guardAdminRequest()
  if (denied) return denied

  try {
    const categories = await findCategories(prisma)
    const body: CategoriesResponse = { categories }
    return NextResponse.json(body)
  } catch (error) {
    console.error("GET /api/admin/categories failed:", error)
    return apiError(500, API_MESSAGES.serverError)
  }
}
