import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  countOrderItemsForProduct,
  deleteProduct,
  findProductById,
  updateProduct,
} from "@/lib/admin/product-admin-repository"
import {
  deleteProductSafely,
  PRODUCT_MESSAGES,
  saveProduct,
} from "@/lib/admin/product-admin-service"
import { parseRouteId } from "@/lib/admin/admin-params"
import { API_MESSAGES, apiError, guardAdminRequest } from "@/lib/admin/api-guard"

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const denied = await guardAdminRequest()
  if (denied) return denied

  const id = parseRouteId((await params).id)
  if (id === null) return apiError(400, PRODUCT_MESSAGES.invalidId)

  try {
    const existing = await findProductById(prisma, id)
    if (!existing) return apiError(404, PRODUCT_MESSAGES.notFound)

    const input = await request.json().catch(() => null)

    const result = await saveProduct(input, {
      save: (values) => updateProduct(prisma, id, values),
    })

    if (!result.ok) {
      return apiError(result.status, result.error, result.fieldErrors)
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error(`PUT /api/admin/products/${id} failed:`, error)
    return apiError(500, API_MESSAGES.serverError)
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const denied = await guardAdminRequest()
  if (denied) return denied

  const id = parseRouteId((await params).id)
  if (id === null) return apiError(400, PRODUCT_MESSAGES.invalidId)

  try {
    const result = await deleteProductSafely(id, {
      findProductById: (productId) => findProductById(prisma, productId),
      countOrderItems: (productId) => countOrderItemsForProduct(prisma, productId),
      deleteProduct: (productId) => deleteProduct(prisma, productId),
    })

    if (!result.ok) {
      return apiError(result.status, result.error)
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error(`DELETE /api/admin/products/${id} failed:`, error)
    return apiError(500, API_MESSAGES.serverError)
  }
}
