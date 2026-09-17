// @vitest-environment node
import { existsSync } from "node:fs"
import { afterAll, describe, expect, it } from "vitest"

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { PrismaClient } from "@generated/prisma/client"
import { findProductPage } from "@/lib/product/product-repository"

/**
 * Integration test — คุยกับ SQLite จริงที่ prisma/test.db (ไม่ใช่ dev.db)
 * สร้างฐานข้อมูลก่อนรันด้วย: npm run db:test:setup
 *
 * สร้าง PrismaClient ของตัวเองแล้วส่งเข้า repository ห้ามใช้ singleton `@/lib/prisma`
 * เพราะ singleton ผูกกับ DATABASE_URL ตั้งแต่ตอน import จะชี้ไป dev.db เสมอ
 *
 * เทสของ buildProductWhere (pure function, ไม่แตะ DB) ย้ายไปอยู่ที่
 * tests/unit/product-repository.test.ts แล้ว ไฟล์นี้เหลือเฉพาะเทสที่ต้องพึ่งฐานข้อมูลจริง
 */
const TEST_DB_PATH = "prisma/test.db"
const hasTestDb = existsSync(TEST_DB_PATH)

const prisma = hasTestDb
  ? new PrismaClient({
      adapter: new PrismaBetterSqlite3({ url: `file:./${TEST_DB_PATH}` }),
    })
  : null

afterAll(async () => {
  await prisma?.$disconnect()
})

describe.skipIf(!hasTestDb)("findProductPage (ต้องรัน npm run db:test:setup ก่อน)", () => {
  it("คืนสินค้าหน้าแรกตามขนาดหน้าที่กำหนด", async () => {
    const { rows, total } = await findProductPage(prisma!, { q: "", page: 1, pageSize: 5 })

    expect(rows).toHaveLength(5)
    expect(total).toBeGreaterThanOrEqual(5)
  })

  it("หน้า 2 ต้องไม่ซ้ำกับหน้า 1 และ total ต้องเท่ากันทุกหน้า", async () => {
    const first = await findProductPage(prisma!, { q: "", page: 1, pageSize: 5 })
    const second = await findProductPage(prisma!, { q: "", page: 2, pageSize: 5 })

    const firstIds = first.rows.map((row) => row.id)
    expect(second.rows.every((row) => !firstIds.includes(row.id))).toBe(true)
    expect(second.total).toBe(first.total)
  })

  it("หน้าที่เกินขอบเขตต้องได้ rows ว่างเปล่า ไม่ throw", async () => {
    const { rows, total } = await findProductPage(prisma!, { q: "", page: 9999, pageSize: 10 })

    expect(rows).toEqual([])
    expect(total).toBeGreaterThan(0)
  })

  it("กรองตามคำค้นที่มีอยู่จริง (ข้อมูลจาก docs seed): iPhone 16 Pro มีอยู่ 1 รายการ", async () => {
    const found = await findProductPage(prisma!, { q: "iPhone", page: 1, pageSize: 10 })

    expect(found.total).toBe(1)
    expect(found.rows[0]?.name).toBe("iPhone 16 Pro")
  })

  it("กรองตามคำค้นที่ไม่มีในฐานข้อมูล = ไม่พบสินค้า", async () => {
    const { rows, total } = await findProductPage(prisma!, {
      q: "ไม่มีสินค้านี้แน่นอน-xyz",
      page: 1,
      pageSize: 10,
    })

    expect(rows).toEqual([])
    expect(total).toBe(0)
  })

  it("ผลลัพธ์รวม product_images เข้ามาด้วย", async () => {
    const { rows } = await findProductPage(prisma!, { q: "iPhone", page: 1, pageSize: 1 })

    expect(rows[0]).toHaveProperty("product_images")
  })
})
