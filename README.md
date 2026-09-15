# ระบบ E-Commerce CodingThailand

เว็บแอปตัวอย่างสำหรับเรียนการเขียน Next.js — มีระบบสมาชิก ตะกร้าสินค้า รายการสินค้า และฟอร์มติดต่อ

สร้างด้วย Next.js 16 (App Router) + React 19, Prisma 7 + SQLite, Better Auth, shadcn/ui และ Tailwind CSS v4

---

## ความต้องการของระบบ

| รายการ | เวอร์ชัน | หมายเหตุ |
|--------|----------|----------|
| Node.js | **20.9.0 ขึ้นไป** | ตรวจด้วย `node -v` |
| npm | มากับ Node.js | ตรวจด้วย `npm -v` |
| Git | เวอร์ชันใดก็ได้ | |

> **ไม่ต้องติดตั้ง MySQL/MariaDB** โปรเจกต์นี้ใช้ SQLite ซึ่งเก็บข้อมูลเป็นไฟล์เดียวที่ `prisma/dev.db` สร้างขึ้นเองตอนตั้งค่า

---

## เริ่มต้นใช้งาน

### 1. Clone โปรเจกต์

```bash
git clone https://github.com/codingthailand/sw-testing-starter-app.git
cd sw-testing-starter-app
```

### 2. สร้างไฟล์ `.env`

```bash
cp .env.example .env
```

> Windows (Command Prompt) ใช้ `copy .env.example .env`

`DATABASE_URL` ในไฟล์ตั้งค่ามาให้เรียบร้อยแล้ว ไม่ต้องแก้

### 3. ตั้งค่า `BETTER_AUTH_SECRET`

**ขั้นตอนนี้ห้ามข้าม** ถ้าปล่อยว่างไว้ `npm run dev` จะยังรันได้ แต่ `npm run build` จะพังด้วยข้อความ `You are using the default secret`

สร้างค่าสุ่มด้วยคำสั่ง (ใช้ได้ทุกระบบปฏิบัติการ):

```bash
npx @better-auth/cli secret
```

แล้วนำค่าที่ได้ไปใส่ในไฟล์ `.env`:

```env
BETTER_AUTH_SECRET=ค่าที่สุ่มได้จากคำสั่งด้านบน
```

> บน macOS/Linux จะใช้ `openssl rand -base64 32` แทนก็ได้

### 4. ติดตั้ง dependencies

```bash
npm install
```

### 5. เตรียมฐานข้อมูล

```bash
npx prisma generate    # สร้าง Prisma Client ไปที่ generated/prisma/
npx prisma db push     # สร้างไฟล์ prisma/dev.db พร้อมตารางทั้งหมด
```

### 6. ใส่ข้อมูลสินค้าตัวอย่าง (แนะนำ)

ถ้าข้ามขั้นนี้ ฐานข้อมูลจะว่างเปล่า หน้า `/product` จะไม่มีสินค้าแสดง และส่วน "สินค้าแนะนำ" บนหน้าแรกจะหายไปทั้งบล็อก

```bash
sqlite3 prisma/dev.db < docs/insert_data_ecom_example_50_products.sql
```

จะได้สินค้า 50 รายการ, 5 หมวดหมู่, ลูกค้าและคำสั่งซื้อตัวอย่าง

> Windows หรือเครื่องที่ไม่มีคำสั่ง `sqlite3` ใช้คำสั่งนี้แทน:
>
> ```bash
> node -e "const D=require('better-sqlite3'),f=require('fs');new D('prisma/dev.db').exec(f.readFileSync('docs/insert_data_ecom_example_50_products.sql','utf8'))"
> ```

### 7. รันเซิร์ฟเวอร์

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) ในเบราว์เซอร์

ลองสมัครสมาชิกที่ `/signup` แล้วเข้าสู่ระบบที่ `/login` และดูรายการสินค้าที่ `/product`

---

## คำสั่งที่ใช้บ่อย

| งาน | คำสั่ง |
|-----|--------|
| รัน dev server | `npm run dev` |
| รัน dev server พอร์ตอื่น | `npm run dev -- -p 3100` |
| Build สำหรับ production | `npm run build` |
| รันตัวที่ build แล้ว | `npm start` |
| ตรวจ lint | `npm run lint` |
| สร้าง Prisma Client ใหม่ | `npx prisma generate` |
| อัปเดตโครงสร้างฐานข้อมูล | `npx prisma db push` |
| สร้างฐานข้อมูลสำหรับทดสอบ | `npm run db:test:setup` |
| ใส่คำสั่งซื้อย้อนหลัง 90 วัน | `npm run db:seed:orders` |
| เปิดดู/แก้ข้อมูลผ่าน GUI | `npx prisma studio` |

> โปรเจกต์นี้ยังไม่มีการตั้งค่า test framework แต่โครงสร้างโค้ดเตรียมไว้ให้เขียนเทสต์ได้แล้ว (ดูหัวข้อถัดไป)

---

## ตัวแปรใน `.env`

| ตัวแปร | จำเป็น | คำอธิบาย |
|--------|--------|----------|
| `DATABASE_URL` | ✅ | ตำแหน่งไฟล์ SQLite ตั้งค่ามาให้แล้วเป็น `file:./prisma/dev.db` |
| `BETTER_AUTH_SECRET` | ✅ | กุญแจเข้ารหัส session ต้องสุ่มเอง (ดูขั้นตอนที่ 3) |
| `BETTER_AUTH_URL` | ✅ | URL ของเว็บ ตอนพัฒนาคือ `http://localhost:3000` |
| `RESEND_API_KEY` | ❌ | ใช้เฉพาะให้ฟอร์มติดต่อส่งอีเมลได้จริง |
| `CONTACT_FROM_EMAIL` | ❌ | อีเมลผู้ส่งของฟอร์มติดต่อ |
| `CONTACT_TO_EMAIL` | ❌ | อีเมลผู้รับของฟอร์มติดต่อ |
| `COURSE_API_URL` | ❌ | ชี้ API หลักสูตรไปที่อื่น ใช้ตอนรัน e2e ถ้าไม่ตั้งจะใช้ API จริง |

ถ้าไม่ตั้งค่า 3 ตัวล่าง ฟอร์มติดต่อจะยังใช้งานได้ตามปกติ แต่ตอนกดส่งจะขึ้นข้อความว่ายังไม่ได้ตั้งค่าการส่งอีเมล

> ไฟล์ `.env` ไม่ถูกเก็บลง Git (อยู่ใน `.gitignore`) อย่า commit ขึ้น repository

---

## หน้าผู้ดูแลระบบ (Admin)

เข้าที่ `/admin` — มีแดชบอร์ดสรุปยอดขายและหน้าจัดการสินค้าแบบ CRUD

**ต้องตั้งตัวเองเป็นแอดมินก่อน** ระบบไม่มีปุ่มให้เลื่อนขั้นตัวเอง (กันไม่ให้ใครก็สมัครแล้วเป็นแอดมินได้) ต้องแก้ในฐานข้อมูลโดยตรง:

```bash
sqlite3 prisma/dev.db "UPDATE user SET role='admin' WHERE email='อีเมลของคุณ';"
```

> เครื่องที่ไม่มี `sqlite3` ใช้ `npx prisma studio` แล้วแก้ช่อง `role` ในตาราง `user` เป็น `admin`

จากนั้นออกจากระบบแล้วเข้าใหม่ เพื่อให้ session อ่านค่า role ใหม่

**ใส่ข้อมูลให้กราฟมีอะไรดู** ข้อมูลตัวอย่างชุดหลักมีคำสั่งซื้อไม่กี่รายการและเป็นวันที่ตายตัว พอเวลาผ่านไปจะหลุดออกนอกช่วง 7/30/90 วัน ทำให้กราฟว่าง รันคำสั่งนี้เพื่อสร้างคำสั่งซื้อย้อนหลังโดยอิงวันที่ปัจจุบัน:

```bash
npm run db:seed:orders
```

**สิ่งที่ทำได้ในหน้า Admin**

| หน้า | ทำอะไรได้ |
|------|-----------|
| `/admin` | ดูยอดขายรวม จำนวนคำสั่งซื้อ สินค้า ลูกค้า, กราฟยอดขายเลือกช่วง 7/30/90 วัน, คำสั่งซื้อล่าสุด (รีเฟรชเองทุก 30 วินาที) |
| `/admin/products` | ค้นหา แบ่งหน้า เพิ่ม แก้ไข และลบสินค้า |

> สินค้าที่มีคนสั่งซื้อไปแล้วจะลบไม่ได้ ระบบจะขึ้นข้อความอธิบายแทนที่จะพัง

---

## การเตรียมโค้ดสำหรับเขียนเทสต์

โปรเจกต์นี้แยกโค้ดออกเป็นชั้น ๆ เพื่อให้ทดสอบได้ทีละส่วน โดยยังไม่ได้ติดตั้ง test framework

**ฟังก์ชันล้วน (unit test ได้ทันที ไม่ต้องตั้งค่าอะไร)**

| ไฟล์ | หน้าที่ |
|------|---------|
| `src/lib/cart/cart-logic.ts` | เพิ่ม/ลบ/แก้จำนวนสินค้า และคิดยอดรวม |
| `src/lib/product/product-params.ts` | แปลงค่าจาก URL และคำนวณจำนวนหน้า |
| `src/lib/product/product-view-model.ts` | แปลงข้อมูลจาก DB ให้หน้าเว็บใช้ |
| `src/lib/product/product-url.ts` | ประกอบ URL ของหน้าสินค้า |
| `src/lib/format.ts` | จัดรูปแบบราคา สกุลเงินบาท จำนวน และวันที่ภาษาไทย |
| `src/lib/contact/honeypot.ts` | ตรวจจับบอทจากช่องที่ซ่อนไว้ |
| `src/lib/contact-schema.ts`, `src/lib/auth-schema.ts` | กฎการตรวจฟอร์ม |

**จุดที่ฉีด dependency เข้าไปแทนของจริงได้** — ทุกตัวมีค่า default อยู่แล้ว โค้ดที่เรียกใช้ไม่ต้องแก้

| สิ่งที่แทนได้ | วิธี |
|---------------|------|
| ฐานข้อมูล | `findProductPage(prismaClient, query)` — ส่ง client ที่ชี้ไป `prisma/test.db` |
| การตรวจไฟล์รูป | `toProductViewModel(row, imageExists)` — ส่งฟังก์ชันปลอมแทนการอ่านดิสก์ |
| API หลักสูตร | `fetchCourses({ fetchImpl })` หรือตั้ง `COURSE_API_URL` |
| การส่งอีเมล | `handleContactSubmission(input, { createSender })` |
| ค่า env | `getContactEmailConfig(env)`, `resolveCourseApiUrl(env)` |
| ตะกร้าสินค้า | `createCartStore({ storage: null })` — ได้ store ใหม่ที่ไม่แตะ localStorage |

**ฐานข้อมูลสำหรับทดสอบ**

```bash
npm run db:test:setup             # สร้าง prisma/test.db พร้อมข้อมูลตัวอย่าง 50 รายการ
node scripts/setup-test-db.mjs --empty   # สร้างตารางเปล่า ไม่ใส่ข้อมูล
```

รันแล้วจะได้ไฟล์แยกจาก `prisma/dev.db` ทำให้เทสต์ที่เพิ่ม/ลบข้อมูลไม่ทำให้ข้อมูลที่ใช้พัฒนาพัง

**E2E** — element สำคัญมี `data-testid` กำกับไว้แล้ว ให้ใช้ตัวนี้แทนการจับข้อความภาษาไทยซึ่งเปลี่ยนบ่อย

```
หน้าแรก    featured-product-list featured-product-card
หน้าร้าน   product-search-input  product-card     add-to-cart       product-next-page
           cart-row              cart-item-qty    cart-total        cart-checkout
           cart-count            cart-empty       course-card       course-error
เข้าระบบ   login-email           login-password   login-submit      logout-button
           signup-name           signup-email     signup-submit     nav-user-name
ติดต่อ     contact-name          contact-message  contact-submit    contact-success
แดชบอร์ด   kpi-revenue-value     period-7d        revenue-total     recent-order-row
           stats-loading         stats-error      stats-retry       revenue-empty
จัดการสินค้า product-search       product-row      product-create    product-edit
           product-delete        product-form     product-form-submit
           delete-dialog         delete-confirm   delete-cancel     product-pagination
```

ทุก section ของหน้า Admin ใช้รูปแบบเดียวกัน: `<ชื่อ>-loading`, `<ชื่อ>-error`, `<ชื่อ>-retry` เช่น `stats-error` กับ `stats-retry`

Toast ไม่รองรับ `data-testid` จึงใช้ class แทน — `.admin-toast-success` และ `.admin-toast-error`

หน้า `/course` ดึงข้อมูลจาก API ภายนอกจริง ถ้าไม่อยากให้เทสต์ขึ้นกับอินเทอร์เน็ต ให้ตั้ง `COURSE_API_URL` ชี้ไป mock server หรือดักที่ระดับ network ในเครื่องมือ e2e โดยใช้ข้อมูลจาก `docs/fixtures/courses.json`

---

## โครงสร้างโปรเจกต์

```
src/
├─ app/
│  ├─ (auth)/          หน้า login และ signup
│  ├─ (front)/         หน้าสาธารณะ (หน้าแรก, สินค้า, ตะกร้า, คอร์ส, เกี่ยวกับเรา, ติดต่อ)
│  ├─ admin/           หน้าผู้ดูแลระบบ (แดชบอร์ด, จัดการสินค้า)
│  ├─ api/admin/       Route Handlers ของหน้าผู้ดูแลระบบ
│  └─ api/auth/        API ของ Better Auth
├─ components/         คอมโพเนนต์ที่ใช้ร่วมกัน + shadcn/ui
├─ lib/                logic ทั้งหมด แยกเป็น cart/ product/ course/ contact/ admin/
└─ types/              ชนิดข้อมูลของโดเมน (cart, product, course, admin)
prisma/
├─ schema.prisma       โครงสร้างฐานข้อมูล
├─ dev.db              ไฟล์ฐานข้อมูลตอนพัฒนา (ไม่ถูกเก็บลง Git)
└─ test.db             ไฟล์ฐานข้อมูลสำหรับเทสต์ (ไม่ถูกเก็บลง Git)
scripts/               สคริปต์ช่วยงาน เช่น สร้างฐานข้อมูลทดสอบ
docs/                  ไฟล์ SQL ข้อมูลตัวอย่าง และ fixtures/ สำหรับ mock API
```

---

## แก้ปัญหาที่พบบ่อย

**`npm install` ขึ้น warning เรื่อง `allow-scripts`**
ไม่เป็นไร ข้ามได้เลย `better-sqlite3` มีไฟล์ที่คอมไพล์สำเร็จรูปมาให้แล้ว ไม่ต้อง build เอง

**แก้ schema แล้วข้อมูลไม่อัปเดต / บันทึกแล้วหาย**
หลังรัน `npx prisma db push` ต้องปิดแล้วเปิด `npm run dev` ใหม่ทุกครั้ง เพราะไฟล์ฐานข้อมูลถูกสร้างใหม่ แต่เซิร์ฟเวอร์ที่ค้างอยู่ยังอ้างถึงไฟล์เดิม

**`npm run build` ขึ้น `You are using the default secret`**
ยังไม่ได้ตั้ง `BETTER_AUTH_SECRET` ในไฟล์ `.env` ย้อนไปทำขั้นตอนที่ 3

**หน้า `/product` ไม่มีสินค้า หรือหน้าแรกไม่มีส่วน "สินค้าแนะนำ"**
ยังไม่ได้ใส่ข้อมูลตัวอย่าง ย้อนไปทำขั้นตอนที่ 6 (หน้าแรกดึงสินค้า 4 ชิ้นแรกจากฐานข้อมูลเดียวกัน)

**พอร์ต 3000 ถูกใช้งานอยู่**
รันด้วยพอร์ตอื่น เช่น `npm run dev -- -p 3100` แล้วแก้ `BETTER_AUTH_URL` ใน `.env` ให้ตรงกัน

**อยากล้างฐานข้อมูลเริ่มใหม่**
ลบไฟล์ `prisma/dev.db` แล้วทำขั้นตอนที่ 5 และ 6 ใหม่

---

## เรียนรู้เพิ่มเติม

- [Next.js Documentation](https://nextjs.org/docs) — เอกสารและฟีเจอร์ของ Next.js
- [Prisma Documentation](https://www.prisma.io/docs) — การใช้งาน Prisma ORM
- [Better Auth Documentation](https://www.better-auth.com/docs) — ระบบยืนยันตัวตน
- [shadcn/ui](https://ui.shadcn.com) — คอมโพเนนต์ UI ที่ใช้ในโปรเจกต์
