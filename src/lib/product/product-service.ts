import type { PrismaClient } from "@generated/prisma/client"
import type { ProductListResult } from "@/types/product"
import {
  PRODUCT_PAGE_SIZE,
  calcTotalPages,
  parseProductSearchParams,
} from "./product-params"
import { findProductPage } from "./product-repository"
import { toProductViewModels, type ImageExists } from "./product-view-model"

type GetProductListDeps = {
  prisma: PrismaClient
  imageExists: ImageExists
  pageSize?: number
}

/**
 * รวมทุกขั้นของหน้าสินค้าไว้ที่เดียว: parse params -> query -> แปลงเป็น view model
 * ทุก dependency ถูกส่งเข้ามา ทำให้ทดสอบชั้นนี้ได้โดยไม่ต้อง render หน้าเว็บ
 */
export async function getProductList(
  searchParams: { [key: string]: string | string[] | undefined },
  { prisma, imageExists, pageSize = PRODUCT_PAGE_SIZE }: GetProductListDeps
): Promise<ProductListResult> {
  const { q, page } = parseProductSearchParams(searchParams)

  const { rows, total } = await findProductPage(prisma, { q, page, pageSize })

  return {
    products: toProductViewModels(rows, imageExists),
    total,
    page,
    pageSize,
    totalPages: calcTotalPages(total, pageSize),
    q,
  }
}
