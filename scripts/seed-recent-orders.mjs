#!/usr/bin/env node
/**
 * เพิ่มคำสั่งซื้อย้อนหลัง 90 วัน เพื่อให้กราฟยอดขายใน Admin Dashboard มีข้อมูลให้ดู
 *
 * ข้อมูลตัวอย่างชุดเดิมใน docs/ มีออร์เดอร์แค่ไม่กี่รายการและเป็นวันที่ตายตัว
 * พอเวลาผ่านไปก็หลุดออกนอกช่วง 7/30/90 วัน ทำให้ Dashboard ว่างเปล่า
 * สคริปต์นี้สร้างออร์เดอร์โดยอิงวันที่ปัจจุบัน จึงเห็นข้อมูลเสมอไม่ว่ารันเมื่อไหร่
 *
 *   node scripts/seed-recent-orders.mjs                 # prisma/dev.db
 *   node scripts/seed-recent-orders.mjs prisma/test.db  # ระบุไฟล์เอง
 */
import Database from "better-sqlite3"
import { existsSync } from "node:fs"
import { join } from "node:path"

const dbPath = join(process.cwd(), process.argv[2] ?? "prisma/dev.db")
if (!existsSync(dbPath)) {
  console.error(`ไม่พบไฟล์ฐานข้อมูล: ${dbPath}`)
  process.exit(1)
}

const db = new Database(dbPath)

const customers = db.prepare("SELECT id FROM customers").all()
const products = db.prepare("SELECT id, price FROM products WHERE price IS NOT NULL").all()

if (customers.length === 0 || products.length === 0) {
  console.error("ต้องมีข้อมูลลูกค้าและสินค้าก่อน — รัน seed ชุดหลักใน docs/ ก่อน")
  process.exit(1)
}

// ลบเฉพาะออร์เดอร์ที่สคริปต์นี้เคยสร้าง (id ตั้งแต่ 1000 ขึ้นไป) เพื่อให้รันซ้ำได้
db.prepare("DELETE FROM order_items WHERE order_id >= 1000").run()
db.prepare("DELETE FROM orders WHERE id >= 1000").run()

const STATUSES = ["received", "processing", "delivered"]
const insertOrder = db.prepare(
  "INSERT INTO orders (id, date, customer_id, status, total_amount) VALUES (?, ?, ?, ?, ?)"
)
const insertItem = db.prepare(
  "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)"
)

// ใช้ seed คงที่ เพื่อให้รันกี่ครั้งก็ได้ข้อมูลชุดเดิม — สำคัญมากถ้าจะเอาไปใช้กับ e2e
let seed = 20260915
const random = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648
  return seed / 2147483648
}

const now = new Date()
let orderId = 1000
let createdOrders = 0
let createdItems = 0

const run = db.transaction(() => {
  for (let daysAgo = 89; daysAgo >= 0; daysAgo -= 1) {
    // เว้นบางวันไม่ให้มีออร์เดอร์ เพื่อให้เห็นว่ากราฟเติมวันที่ยอด 0 ได้ถูกต้อง
    if (random() < 0.25) continue

    const ordersToday = 1 + Math.floor(random() * 3)
    for (let n = 0; n < ordersToday; n += 1) {
      const date = new Date(now)
      date.setDate(date.getDate() - daysAgo)
      date.setHours(9 + Math.floor(random() * 10), Math.floor(random() * 60), 0, 0)

      const customer = customers[Math.floor(random() * customers.length)]
      const status = STATUSES[Math.floor(random() * STATUSES.length)]

      const itemCount = 1 + Math.floor(random() * 3)
      const items = []
      let total = 0
      for (let i = 0; i < itemCount; i += 1) {
        const product = products[Math.floor(random() * products.length)]
        const quantity = 1 + Math.floor(random() * 2)
        items.push({ productId: product.id, quantity, price: product.price })
        total += product.price * quantity
      }

      orderId += 1
      insertOrder.run(
        orderId,
        date.toISOString().replace("T", " ").slice(0, 19),
        customer.id,
        status,
        Math.round(total * 100) / 100
      )
      for (const item of items) {
        insertItem.run(orderId, item.productId, item.quantity, item.price)
      }
      createdOrders += 1
      createdItems += items.length
    }
  }
})

run()
db.close()

console.log(`สร้างคำสั่งซื้อย้อนหลัง 90 วันแล้ว: ${createdOrders} รายการ, ${createdItems} รายการสินค้า`)
console.log(`ฐานข้อมูล: ${dbPath}`)
