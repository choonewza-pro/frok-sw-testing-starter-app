# ระบบ E-Commerce COSCI

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

ถ้าข้ามขั้นนี้ ฐานข้อมูลจะว่างเปล่าและหน้า `/product` จะไม่มีสินค้าแสดง

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
| เปิดดู/แก้ข้อมูลผ่าน GUI | `npx prisma studio` |

> โปรเจกต์นี้ยังไม่มีการตั้งค่า test framework

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

ถ้าไม่ตั้งค่า 3 ตัวล่าง ฟอร์มติดต่อจะยังใช้งานได้ตามปกติ แต่ตอนกดส่งจะขึ้นข้อความว่ายังไม่ได้ตั้งค่าการส่งอีเมล

> ไฟล์ `.env` ไม่ถูกเก็บลง Git (อยู่ใน `.gitignore`) อย่า commit ขึ้น repository

---

## โครงสร้างโปรเจกต์

```
src/
├─ app/
│  ├─ (auth)/          หน้า login และ signup
│  ├─ (front)/         หน้าสาธารณะ (หน้าแรก, สินค้า, ตะกร้า, คอร์ส, ติดต่อ)
│  └─ api/auth/        API ของ Better Auth
├─ components/         คอมโพเนนต์ที่ใช้ร่วมกัน + shadcn/ui
└─ lib/                prisma, auth, cart store, zod schema
prisma/
├─ schema.prisma       โครงสร้างฐานข้อมูล
└─ dev.db              ไฟล์ฐานข้อมูล SQLite (ไม่ถูกเก็บลง Git)
docs/                  ไฟล์ SQL ข้อมูลตัวอย่าง
```

---

## แก้ปัญหาที่พบบ่อย

**`npm install` ขึ้น warning เรื่อง `allow-scripts`**
ไม่เป็นไร ข้ามได้เลย `better-sqlite3` มีไฟล์ที่คอมไพล์สำเร็จรูปมาให้แล้ว ไม่ต้อง build เอง

**แก้ schema แล้วข้อมูลไม่อัปเดต / บันทึกแล้วหาย**
หลังรัน `npx prisma db push` ต้องปิดแล้วเปิด `npm run dev` ใหม่ทุกครั้ง เพราะไฟล์ฐานข้อมูลถูกสร้างใหม่ แต่เซิร์ฟเวอร์ที่ค้างอยู่ยังอ้างถึงไฟล์เดิม

**`npm run build` ขึ้น `You are using the default secret`**
ยังไม่ได้ตั้ง `BETTER_AUTH_SECRET` ในไฟล์ `.env` ย้อนไปทำขั้นตอนที่ 3

**หน้า `/product` ไม่มีสินค้า**
ยังไม่ได้ใส่ข้อมูลตัวอย่าง ย้อนไปทำขั้นตอนที่ 6

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
