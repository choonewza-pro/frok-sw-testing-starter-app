// @vitest-environment node
import { existsSync } from "node:fs"
import { afterAll, afterEach, describe, expect, it } from "vitest"

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { PrismaClient } from "@generated/prisma/client"
import {
  countOrderItemsForProduct,
  createProduct,
  deleteProduct,
  findAdminProducts,
  findProductById,
  updateProduct,
} from "@/lib/admin/product-admin-repository"
import {
  PRODUCT_MESSAGES,
  deleteProductSafely,
  saveProduct,
} from "@/lib/admin/product-admin-service"
import { ADMIN_PRODUCT_PAGE_SIZE, parseAdminProductQuery } from "@/lib/admin/admin-params"

/**
 * Integration test — CRUD สินค้าฝั่งแอดมิน โดยคุยกับ SQLite จริงที่ prisma/test.db
 *
 * ต่างจาก unit test อย่างไร
 *   unit test        ส่งของปลอมเข้าไป ตรวจว่า "ตรรกะ" ถูก (tests/exercises/answer/05-mock-functions)
 *   integration test ไม่มีของปลอม เขียนลงฐานข้อมูลจริงแล้วอ่านกลับมาดูว่า "ข้อมูลลงจริงไหม"
 *   จับบั๊กคนละแบบกัน เช่น ชื่อคอลัมน์ผิด, ชนิดข้อมูลไม่ตรง, FK กันการลบ — ของปลอมจับไม่ได้
 *
 * เตรียมฐานข้อมูลก่อนรัน:  npm run db:test:setup
 * รัน:                     npm run test:integration
 *
 * ไฟล์นี้ทดสอบฟังก์ชันชุดเดียวกับที่ src/app/api/admin/products/route.ts เรียกใช้
 * ต่างกันแค่ไม่ได้ผ่าน HTTP และไม่ได้เช็คสิทธิ์ (guardAdminRequest) เท่านั้น
 */
const TEST_DB_PATH = "prisma/test.db"
const hasTestDb = existsSync(TEST_DB_PATH)

// สร้าง client ของตัวเองชี้มาที่ test.db — ห้ามใช้ singleton `@/lib/prisma`
// เพราะ singleton ผูกกับ DATABASE_URL ตั้งแต่ตอน import จะไปเขียนทับ dev.db
const prisma = hasTestDb
  ? new PrismaClient({
      adapter: new PrismaBetterSqlite3({ url: `file:./${TEST_DB_PATH}` }),
    })
  : null

/**
 * สินค้าที่เทสต์สร้างขึ้นจะขึ้นต้นด้วยคำนี้ทั้งหมด เพื่อให้เก็บกวาดทีเดียวได้
 * และเพราะ vitest รันไฟล์เทสต์ขนานกันบนฐานข้อมูลไฟล์เดียว แต่ละไฟล์จึงต้องใช้คำนำหน้าของตัวเอง
 * แล้วนับ/ค้นเฉพาะข้อมูลของตัวเอง ไม่งั้นจะไปลบหรือไปนับของที่อีกไฟล์กำลังใช้อยู่
 */
const TEST_PREFIX = "[ทดสอบ-repo]"

const SEED_CATEGORY_ID = 1 // สมาร์ทโฟน — มาจาก docs/insert_data_ecom_example_50_products.sql

function newProductValues(over: Partial<Parameters<typeof createProduct>[1]> = {}) {
  return {
    name: `${TEST_PREFIX} หูฟังไร้สาย`,
    description: "ของทดสอบ",
    price: 1290,
    categoryId: SEED_CATEGORY_ID,
    ...over,
  }
}

afterAll(async () => {
  await prisma?.$disconnect()
})

describe.skipIf(!hasTestDb)("CRUD สินค้าแอดมิน (ต้องรัน npm run db:test:setup ก่อน)", () => {
  const db = prisma!

  // เก็บกวาดหลังทุกเคส ไม่งั้นรันรอบสองจะเจอข้อมูลค้างจากรอบแรกแล้วผลเพี้ยน
  afterEach(async () => {
    await db.products.deleteMany({ where: { name: { startsWith: TEST_PREFIX } } })
  })

  /**
   * ภาพรวมทั้งวงจร: สร้าง → อ่าน → แก้ไข → ลบ
   * เขียนรวมในเคสเดียวเพื่อให้เห็นลำดับ ส่วนเคสถัด ๆ ไปค่อยแยกดูทีละเรื่อง
   */
  it("สร้าง → อ่าน → แก้ไข → ลบ ครบวงจร", async () => {
    // CREATE
    const created = await createProduct(db, newProductValues())
    expect(created.id).toBeGreaterThan(0)

    // READ — อ่านกลับจากฐานข้อมูลจริง ไม่ใช่เชื่อค่าที่ create คืนมา
    const found = await findProductById(db, created.id)
    expect(found?.name).toBe(`${TEST_PREFIX} หูฟังไร้สาย`)
    expect(Number(found?.price)).toBe(1290)

    // UPDATE
    const updated = await updateProduct(db, created.id, newProductValues({ price: 990 }))
    expect(updated.price).toBe(990)
    expect((await findProductById(db, created.id))?.price).toBe(990)

    // DELETE
    await deleteProduct(db, created.id)
    expect(await findProductById(db, created.id)).toBeNull()
  })

  describe("POST /api/admin/products — สร้าง", () => {
    it("บันทึกลงฐานข้อมูลจริง และ join ชื่อหมวดหมู่กลับมาให้", async () => {
      const created = await createProduct(db, newProductValues())

      expect(created).toMatchObject({
        name: `${TEST_PREFIX} หูฟังไร้สาย`,
        price: 1290,
        categoryId: SEED_CATEGORY_ID,
        categoryName: "สมาร์ทโฟน",
      })
      // price ต้องเป็น number ไม่ใช่ string/Decimal เพราะต้องส่งข้าม network
      expect(typeof created.price).toBe("number")
    })

    it("แปลง description ที่เป็นข้อความว่างให้เก็บเป็น null", async () => {
      const created = await createProduct(db, newProductValues({ description: "" }))

      const row = await findProductById(db, created.id)
      expect(row?.description).toBeNull()
    })

    it("ข้อมูลไม่ผ่าน schema → คืน 400 และต้องไม่มีแถวใหม่เกิดขึ้น", async () => {
      // เส้นทางเดียวกับที่ route ใช้: saveProduct ตรวจก่อน แล้วค่อยเรียก createProduct
      const result = await saveProduct(newProductValues({ price: 0 }), {
        save: (values) => createProduct(db, values),
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.status).toBe(400)
        expect(result.fieldErrors?.price).toContain("ราคาต้องมากกว่า 0")
      }
      // หัวใจของเคสนี้: ยืนยันกับฐานข้อมูลว่าไม่มีขยะหลุดเข้าไป
      expect(await db.products.count({ where: { name: { startsWith: TEST_PREFIX } } })).toBe(0)
    })
  })

  describe("GET /api/admin/products — อ่านและค้นหา", () => {
    it("ค้นหาด้วยชื่อแล้วเจอสินค้าที่เพิ่งสร้าง", async () => {
      await createProduct(db, newProductValues({ name: `${TEST_PREFIX} ลำโพงบลูทูธ (repo)` }))

      const { products, total } = await findAdminProducts(db, {
        search: "ลำโพงบลูทูธ (repo)",
        page: 1,
        pageSize: ADMIN_PRODUCT_PAGE_SIZE,
      })

      expect(total).toBe(1)
      expect(products[0].name).toBe(`${TEST_PREFIX} ลำโพงบลูทูธ (repo)`)
    })

    it("อ่าน query string แบบเดียวกับ route แล้วได้ผลหน้าแรกตามขนาดหน้า", async () => {
      const { search, page } = parseAdminProductQuery(new URLSearchParams("page=1"))

      const { products, total } = await findAdminProducts(db, {
        search,
        page,
        pageSize: ADMIN_PRODUCT_PAGE_SIZE,
      })

      expect(products).toHaveLength(ADMIN_PRODUCT_PAGE_SIZE)
      expect(total).toBeGreaterThanOrEqual(ADMIN_PRODUCT_PAGE_SIZE)
    })

    it("เรียงจากใหม่ไปเก่า — ของที่สร้างทีหลังต้องอยู่บนสุด", async () => {
      const older = await createProduct(db, newProductValues())
      const newer = await createProduct(db, newProductValues())

      // ค้นด้วยคำนำหน้าของไฟล์นี้ จะได้ไม่ปนกับข้อมูลตัวอย่างและไฟล์เทสต์อื่น
      const { products } = await findAdminProducts(db, {
        search: TEST_PREFIX,
        page: 1,
        pageSize: ADMIN_PRODUCT_PAGE_SIZE,
      })

      expect(products.map((p) => p.id)).toEqual([newer.id, older.id])
    })

    it("หน้า 2 ต้องไม่ซ้ำกับหน้า 1", async () => {
      const first = await findAdminProducts(db, { search: "", page: 1, pageSize: 5 })
      const second = await findAdminProducts(db, { search: "", page: 2, pageSize: 5 })

      const firstIds = first.products.map((p) => p.id)
      expect(second.products.some((p) => firstIds.includes(p.id))).toBe(false)
    })
  })

  describe("PUT /api/admin/products/[id] — แก้ไข", () => {
    it("แก้ไขแล้วค่าที่อ่านกลับมาเปลี่ยนจริง", async () => {
      const created = await createProduct(db, newProductValues())

      await updateProduct(
        db,
        created.id,
        newProductValues({ name: `${TEST_PREFIX} หูฟังรุ่นใหม่`, price: 1590, categoryId: 3 })
      )

      const row = await findProductById(db, created.id)
      expect(row?.name).toBe(`${TEST_PREFIX} หูฟังรุ่นใหม่`)
      expect(row?.price).toBe(1590)
      expect(row?.category_id).toBe(3)
    })

    it("ข้อมูลไม่ผ่าน schema → ของเดิมในฐานข้อมูลต้องไม่ถูกแตะ", async () => {
      const created = await createProduct(db, newProductValues())

      const result = await saveProduct(newProductValues({ name: "" }), {
        save: (values) => updateProduct(db, created.id, values),
      })

      expect(result.ok).toBe(false)
      expect((await findProductById(db, created.id))?.name).toBe(`${TEST_PREFIX} หูฟังไร้สาย`)
    })
  })

  describe("DELETE /api/admin/products/[id] — ลบ", () => {
    /** dependency ชุดเดียวกับที่ route ประกอบให้ deleteProductSafely */
    const deleteDeps = {
      findProductById: (id: number) => findProductById(db, id),
      countOrderItems: (id: number) => countOrderItemsForProduct(db, id),
      deleteProduct: (id: number) => deleteProduct(db, id),
    }

    it("ลบสินค้าที่ไม่มีออร์เดอร์อ้างถึงได้ และหาไม่เจออีก", async () => {
      const created = await createProduct(db, newProductValues())

      const result = await deleteProductSafely(created.id, deleteDeps)

      expect(result).toEqual({ ok: true, data: { id: created.id } })
      expect(await findProductById(db, created.id)).toBeNull()
    })

    it("ลบสินค้าที่ถูกใช้ในออร์เดอร์ไม่ได้ → 409 และแถวต้องยังอยู่", async () => {
      // หยิบสินค้าที่มีอยู่ใน order_items จริงจากข้อมูลตัวอย่าง
      const orderItem = await db.order_items.findFirst()
      const productId = orderItem!.product_id

      const result = await deleteProductSafely(productId, deleteDeps)

      expect(result).toEqual({
        ok: false,
        status: 409,
        error: PRODUCT_MESSAGES.hasOrderItems,
      })
      // ถ้าไม่มีการ์ดตัวนี้ ฐานข้อมูลจะโยน foreign key error ที่ผู้ใช้อ่านไม่รู้เรื่อง
      expect(await findProductById(db, productId)).not.toBeNull()
    })

    it("ลบสินค้าที่ไม่มีอยู่ → 404", async () => {
      const result = await deleteProductSafely(999_999, deleteDeps)

      expect(result).toEqual({ ok: false, status: 404, error: PRODUCT_MESSAGES.notFound })
    })
  })
})
