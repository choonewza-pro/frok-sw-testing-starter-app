#!/usr/bin/env node
/**
 * สร้างฐานข้อมูลสำหรับทดสอบแยกจากฐานข้อมูลที่ใช้พัฒนา
 *
 * ทำไมต้องแยก: integration test จะเพิ่ม/ลบข้อมูลระหว่างรัน ถ้าชี้ไปที่ prisma/dev.db
 * ข้อมูลตัวอย่าง 50 รายการที่ seed ไว้จะเพี้ยนหรือหายไป
 *
 *   node scripts/setup-test-db.mjs            # สร้างใหม่ที่ prisma/test.db พร้อมข้อมูลตัวอย่าง
 *   node scripts/setup-test-db.mjs --empty    # สร้างตารางอย่างเดียว ไม่ใส่ข้อมูล
 *
 * เวลาเขียนเทสต์ให้สร้าง PrismaClient ของตัวเองชี้มาที่ไฟล์นี้ แล้วส่งเข้า repository
 * (ฟังก์ชันอย่าง findProductPage รับ client เป็นพารามิเตอร์อยู่แล้ว)
 */
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const TEST_DB_PATH = join(root, "prisma", "test.db")
const TEST_DATABASE_URL = "file:./prisma/test.db"
const SEED_SQL = join(root, "docs", "insert_data_ecom_example_50_products.sql")

const withData = !process.argv.includes("--empty")

for (const suffix of ["", "-journal", "-wal", "-shm"]) {
  const file = `${TEST_DB_PATH}${suffix}`
  if (existsSync(file)) rmSync(file)
}
console.log("ลบฐานข้อมูลทดสอบเดิมแล้ว")

execFileSync("npx", ["prisma", "db", "push", "--url", TEST_DATABASE_URL], {
  stdio: "inherit",
})
console.log(`สร้างตารางที่ ${TEST_DB_PATH} เรียบร้อย`)

if (withData) {
  if (!existsSync(SEED_SQL)) {
    console.error(`ไม่พบไฟล์ข้อมูลตัวอย่าง: ${SEED_SQL}`)
    process.exit(1)
  }
  const { default: Database } = await import("better-sqlite3")
  const db = new Database(TEST_DB_PATH)
  db.exec(readFileSync(SEED_SQL, "utf8"))
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM products").get()
  db.close()
  console.log(`ใส่ข้อมูลตัวอย่างแล้ว: สินค้า ${count} รายการ`)
}

console.log(`\nพร้อมใช้งาน ตั้งค่าใน .env.test หรือส่งเข้าไปตอนรันเทสต์:\n  DATABASE_URL="${TEST_DATABASE_URL}"`)
