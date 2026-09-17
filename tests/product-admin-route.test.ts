// @vitest-environment node
import { existsSync } from "node:fs"
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

/**
 * Integration test ระดับ Route Handler — เรียก GET/POST/PUT/DELETE ของจริงตรง ๆ
 *
 * ต่างจาก tests/integration/product-admin-crud.test.ts ตรงไหน
 *   ไฟล์นั้น   เรียก repository/service โดยตรง = ทดสอบ "ตรรกะ + ฐานข้อมูล"
 *   ไฟล์นี้    เรียกฟังก์ชัน GET/POST ของ route = ได้ชั้น HTTP กับด่านตรวจสิทธิ์มาด้วย
 *              (สถานะ 401/403/400/404/409, การอ่าน query string, การ parse JSON body)
 *
 * ของสามอย่างที่ต้องสลับเป็นของปลอมก่อน เพราะ route ไม่ได้รับ dependency ทางพารามิเตอร์
 *   @/lib/prisma   singleton ชี้ dev.db ตั้งแต่ตอน import → สลับให้ชี้ test.db
 *   next/headers   headers() ใช้ได้เฉพาะตอนมี request จริงของ Next → คืน Headers เปล่า
 *   @/lib/auth     ไม่อยากล็อกอินจริงตอนเทสต์ → คืน session ที่เรากำหนดเอง
 * สังเกตว่าเราไม่ได้ปลอม guardAdminRequest ตัวด่านยังเป็นของจริง จึงได้ทดสอบกฎ 401/403 ไปด้วย
 *
 * เตรียมฐานข้อมูลก่อนรัน:  npm run db:test:setup
 * รัน:                     npm run test:integration
 */
const TEST_DB_PATH = "prisma/test.db"
const hasTestDb = existsSync(TEST_DB_PATH)

/** session ที่ให้ของปลอมคืน — แต่ละเคสเปลี่ยนค่านี้เพื่อสลับสิทธิ์ผู้ใช้ */
const fakeAuth = vi.hoisted(() => ({
  session: null as { user: { id: string; name: string; role: string | null } } | null,
}))

// vi.mock ถูกยกขึ้นไปทำงานก่อน import เสมอ ทุกโมดูลที่ import หลังจากนี้จึงได้ของปลอมไปใช้
vi.mock("@/lib/prisma", async () => {
  const { PrismaClient } = await import("@generated/prisma/client")
  const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3")

  return {
    default: new PrismaClient({
      adapter: new PrismaBetterSqlite3({ url: "file:./prisma/test.db" }),
    }),
  }
})

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}))

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: async () => fakeAuth.session } },
}))

// import หลังประกาศ mock เพื่อให้อ่านง่าย (ของจริงถูกยกขึ้นไปบนสุดอยู่แล้ว)
import prisma from "@/lib/prisma"
import { GET, POST } from "@/app/api/admin/products/route"
import { DELETE, PUT } from "@/app/api/admin/products/[id]/route"
import { API_MESSAGES } from "@/lib/admin/api-guard"
import { PRODUCT_MESSAGES } from "@/lib/admin/product-admin-service"
import type { AdminProduct, AdminProductsResponse } from "@/types/admin"

const BASE_URL = "http://localhost:3000/api/admin/products"

/**
 * vitest รันไฟล์เทสต์ขนานกัน แต่ฐานข้อมูลมีไฟล์เดียว
 * แต่ละไฟล์จึงต้องมีคำนำหน้าของตัวเอง และนับเฉพาะข้อมูลของตัวเองเท่านั้น
 * ไม่งั้นการเก็บกวาดของไฟล์หนึ่งจะไปลบข้อมูลที่อีกไฟล์กำลังใช้อยู่
 */
const TEST_PREFIX = "[ทดสอบ-route]"
const SEED_CATEGORY_ID = 1

const validBody = {
  name: `${TEST_PREFIX} หูฟังไร้สาย`,
  description: "ของทดสอบ",
  price: 1290,
  categoryId: SEED_CATEGORY_ID,
}

/** สร้าง request แบบเดียวกับที่ browser ยิงมา */
function request(url: string, init: { method?: string; body?: string } = {}) {
  return new NextRequest(url, { headers: { "content-type": "application/json" }, ...init })
}

function jsonRequest(url: string, method: string, body: unknown) {
  return request(url, { method, body: typeof body === "string" ? body : JSON.stringify(body) })
}

/** params ของ dynamic route เป็น Promise ใน Next 16 */
function routeContext(id: string | number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

/** นับเฉพาะสินค้าที่ไฟล์นี้สร้าง ไม่ใช่ทั้งตาราง — ผลจึงไม่เพี้ยนตามไฟล์เทสต์อื่น */
function countTestProducts() {
  return prisma.products.count({ where: { name: { startsWith: TEST_PREFIX } } })
}

/** สร้างสินค้าทดสอบผ่าน API เพื่อใช้เป็นข้อมูลตั้งต้นของเคสอื่น */
async function createTestProduct(over: Partial<typeof validBody> = {}) {
  const response = await POST(jsonRequest(BASE_URL, "POST", { ...validBody, ...over }))
  return (await response.json()) as AdminProduct
}

afterAll(async () => {
  await prisma.$disconnect()
})

describe.skipIf(!hasTestDb)("Route Handler สินค้าแอดมิน (ต้องรัน npm run db:test:setup ก่อน)", () => {
  beforeEach(() => {
    // ค่าเริ่มต้นของทุกเคส: ล็อกอินเป็นแอดมิน
    fakeAuth.session = { user: { id: "u1", name: "แอดมิน", role: "admin" } }
  })

  afterEach(async () => {
    await prisma.products.deleteMany({ where: { name: { startsWith: TEST_PREFIX } } })
  })

  describe("ด่านตรวจสิทธิ์", () => {
    it("ยังไม่ได้เข้าระบบ → 401", async () => {
      fakeAuth.session = null

      const response = await GET(request(BASE_URL))

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: API_MESSAGES.unauthenticated })
    })

    it("เข้าระบบแล้วแต่ไม่ใช่แอดมิน → 403", async () => {
      fakeAuth.session = { user: { id: "u2", name: "ลูกค้า", role: "user" } }

      const response = await GET(request(BASE_URL))

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({ error: API_MESSAGES.forbidden })
    })

    it("ไม่ใช่แอดมินแล้วยิง POST → 403 และต้องไม่มีแถวใหม่ในฐานข้อมูล", async () => {
      fakeAuth.session = { user: { id: "u2", name: "ลูกค้า", role: "user" } }

      const response = await POST(jsonRequest(BASE_URL, "POST", validBody))

      expect(response.status).toBe(403)
      expect(await countTestProducts()).toBe(0)
    })
  })

  describe("GET /api/admin/products", () => {
    it("คืนสินค้าหน้าแรกพร้อมข้อมูลแบ่งหน้าครบ", async () => {
      const response = await GET(request(`${BASE_URL}?page=1`))
      const body = (await response.json()) as AdminProductsResponse

      expect(response.status).toBe(200)
      expect(body.products).toHaveLength(body.pageSize)
      expect(body.page).toBe(1)
      expect(body.totalPages).toBe(Math.ceil(body.total / body.pageSize))
    })

    it("ค้นหาด้วย search ใน query string", async () => {
      await createTestProduct({ name: `${TEST_PREFIX} ลำโพงบลูทูธ (route)` })

      const response = await GET(request(`${BASE_URL}?search=ลำโพงบลูทูธ (route)`))
      const body = (await response.json()) as AdminProductsResponse

      expect(body.total).toBe(1)
      expect(body.products[0].name).toBe(`${TEST_PREFIX} ลำโพงบลูทูธ (route)`)
    })
  })

  describe("POST /api/admin/products", () => {
    it("สร้างสำเร็จ → 201 พร้อมข้อมูลสินค้า และมีแถวอยู่ในฐานข้อมูลจริง", async () => {
      const response = await POST(jsonRequest(BASE_URL, "POST", validBody))
      const created = (await response.json()) as AdminProduct

      expect(response.status).toBe(201)
      expect(created).toMatchObject({ name: validBody.name, price: 1290, categoryName: "สมาร์ทโฟน" })

      // ไม่เชื่อแค่ response — ถามฐานข้อมูลซ้ำอีกครั้ง
      const row = await prisma.products.findUnique({ where: { id: created.id } })
      expect(row?.name).toBe(validBody.name)
    })

    it("ข้อมูลไม่ผ่าน schema → 400 พร้อม fieldErrors และไม่มีแถวใหม่", async () => {
      const response = await POST(jsonRequest(BASE_URL, "POST", { ...validBody, price: 0 }))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toBe(PRODUCT_MESSAGES.invalidInput)
      expect(body.fieldErrors.price).toContain("ราคาต้องมากกว่า 0")
      expect(await countTestProducts()).toBe(0)
    })

    it("body ไม่ใช่ JSON → 400 ไม่ใช่ 500", async () => {
      // route เขียน request.json().catch(() => null) ไว้ เคสนี้คือสิ่งที่บรรทัดนั้นกันอยู่
      const response = await POST(jsonRequest(BASE_URL, "POST", "ไม่ใช่ json"))

      expect(response.status).toBe(400)
    })
  })

  describe("PUT /api/admin/products/[id]", () => {
    it("แก้ไขสำเร็จ → 200 และข้อมูลในฐานข้อมูลเปลี่ยนจริง", async () => {
      const created = await createTestProduct()

      const response = await PUT(
        jsonRequest(`${BASE_URL}/${created.id}`, "PUT", {
          ...validBody,
          name: `${TEST_PREFIX} หูฟังรุ่นใหม่`,
          price: 1590,
        }),
        routeContext(created.id)
      )

      expect(response.status).toBe(200)
      const row = await prisma.products.findUnique({ where: { id: created.id } })
      expect(row?.name).toBe(`${TEST_PREFIX} หูฟังรุ่นใหม่`)
      expect(row?.price).toBe(1590)
    })

    it("id ไม่ใช่ตัวเลข → 400", async () => {
      const response = await PUT(
        jsonRequest(`${BASE_URL}/abc`, "PUT", validBody),
        routeContext("abc")
      )

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: PRODUCT_MESSAGES.invalidId })
    })

    it("ไม่พบสินค้า → 404", async () => {
      const response = await PUT(
        jsonRequest(`${BASE_URL}/999999`, "PUT", validBody),
        routeContext(999_999)
      )

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: PRODUCT_MESSAGES.notFound })
    })
  })

  describe("DELETE /api/admin/products/[id]", () => {
    it("ลบสำเร็จ → 200 และแถวหายไปจากฐานข้อมูล", async () => {
      const created = await createTestProduct()

      const response = await DELETE(request(`${BASE_URL}/${created.id}`), routeContext(created.id))

      expect(response.status).toBe(200)
      expect(await prisma.products.findUnique({ where: { id: created.id } })).toBeNull()
    })

    it("สินค้าถูกใช้ในออร์เดอร์ → 409 และแถวต้องยังอยู่", async () => {
      const orderItem = await prisma.order_items.findFirst()
      const productId = orderItem!.product_id

      const response = await DELETE(request(`${BASE_URL}/${productId}`), routeContext(productId))

      expect(response.status).toBe(409)
      expect(await response.json()).toEqual({ error: PRODUCT_MESSAGES.hasOrderItems })
      expect(await prisma.products.findUnique({ where: { id: productId } })).not.toBeNull()
    })

    it("ไม่พบสินค้า → 404", async () => {
      const response = await DELETE(request(`${BASE_URL}/999999`), routeContext(999_999))

      expect(response.status).toBe(404)
    })
  })
})
