import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  createProduct,
  findAdminProducts,
} from "@/lib/admin/product-admin-repository"
import { saveProduct } from "@/lib/admin/product-admin-service"
import {
  ADMIN_PRODUCT_PAGE_SIZE,
  parseAdminProductQuery,
} from "@/lib/admin/admin-params"
import { calcTotalPages } from "@/lib/product/product-params"
import { API_MESSAGES, apiError, guardAdminRequest } from "@/lib/admin/api-guard"
import type { AdminProductsResponse } from "@/types/admin"

export async function GET(request: NextRequest) {
  const denied = await guardAdminRequest()
  if (denied) return denied

  try {
    const { search, page } = parseAdminProductQuery(request.nextUrl.searchParams)
    const pageSize = ADMIN_PRODUCT_PAGE_SIZE

    const { products, total } = await findAdminProducts(prisma, { search, page, pageSize })

    const body: AdminProductsResponse = {
      products,
      total,
      page,
      pageSize,
      totalPages: calcTotalPages(total, pageSize),
    }
    return NextResponse.json(body)
  } catch (error) {
    console.error("GET /api/admin/products failed:", error)
    return apiError(500, API_MESSAGES.serverError)
  }
}

export async function POST(request: NextRequest) {
  const denied = await guardAdminRequest()
  if (denied) return denied

  try {
    const input = await request.json().catch(() => null)

    const result = await saveProduct(input, {
      save: (values) => createProduct(prisma, values),
    })

    if (!result.ok) {
      return apiError(result.status, result.error, result.fieldErrors)
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/products failed:", error)
    return apiError(500, API_MESSAGES.serverError)
  }
}
