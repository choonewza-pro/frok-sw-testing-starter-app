# คู่มือ Vitest สำหรับผู้เรียน

คู่มือลงมือทำ: ติดตั้ง Vitest 5 ในโปรเจกต์ Next.js 16 + React 19 นี้ แล้วเขียน
Unit Test → Component Test → Integration Test ด้วยตัวเอง

อ่านไปทำไปตามลำดับหัวข้อได้เลย ทุกคำสั่งในเอกสารนี้รันจาก **โฟลเดอร์รากของโปรเจกต์**

---

## 1. เตรียมโปรเจกต์ให้รันได้ก่อน

ก่อนจะเขียนเทสต์ ต้องแน่ใจว่าแอปรันได้ปกติ

```bash
cp .env.example .env        # DATABASE_URL ชี้ไป file:./prisma/dev.db อยู่แล้ว
npm install
npx prisma generate
npx prisma db push
npm run dev                 # เปิด http://localhost:3000 ดูว่าขึ้นจริง
```

ถ้าหน้าเว็บขึ้นแล้ว กด `Ctrl + C` ปิด dev server ไว้ก่อน แล้วไปข้อถัดไป

---

## 2. ติดตั้งเครื่องมือทดสอบ

**พิมพ์บรรทัดเดียว** (ใช้ได้ทั้ง cmd, PowerShell, Git Bash, macOS/Linux)

```bash
npm install -D "@types/node@^24" vitest@latest jsdom@latest @testing-library/react@latest @testing-library/dom@latest @testing-library/jest-dom@latest @testing-library/user-event@latest @vitest/coverage-v8@latest @vitest/ui@latest
```

> **ทำไมต้องครอบ `"@types/node@^24"` ด้วยเครื่องหมายคำพูด** — บน cmd ของ Windows เครื่องหมาย `^` คือ
> ตัว escape มันจะถูกกลืนหายไป กลายเป็น `@types/node@24` การครอบด้วย `"…"` ทำให้ `^` รอดมาครบ
> (ตัวอื่นไม่มี `^` จึงไม่ต้องครอบ แต่จะครอบทุกตัวก็ได้ ไม่ผิด)

### ถ้าอยากตัดขึ้นบรรทัดใหม่ให้อ่านง่าย

ตัวคั่นบรรทัดของแต่ละ shell **ไม่เหมือนกัน** ใช้ผิดตัวคำสั่งจะพังทันที

| Shell | ตัวต่อบรรทัด | ตัวอย่าง |
|---|---|---|
| macOS / Linux / Git Bash | `\` | `npm install -D "@types/node@^24" \` |
| Windows **cmd** | `^` | `npm install -D "@types/node@^24" ^` |
| Windows **PowerShell** | `` ` `` (backtick) | ``npm install -D "@types/node@^24" ` `` |

ถ้าไม่แน่ใจว่าตัวเองอยู่ shell ไหน — **พิมพ์บรรทัดเดียวไปเลย ปลอดภัยที่สุด**
(ก๊อปคำสั่งจากเอกสารที่มี `\` ไปวางใน cmd แล้วจะขึ้น error ประมาณ `The syntax of the command is incorrect`)

แต่ละตัวมีไว้ทำอะไร

| แพ็กเกจ | หน้าที่ |
|---|---|
| `vitest` | ตัวรันเทสต์ |
| `jsdom` | จำลอง DOM ให้ render React ได้นอกเบราว์เซอร์ |
| `@testing-library/react` | `render` / `screen` — ทดสอบ component แบบที่ผู้ใช้เห็น |
| `@testing-library/dom` | แกนของ query ต่าง ๆ (peer ของตัวบน) |
| `@testing-library/user-event` | จำลองการคลิก/พิมพ์เหมือนผู้ใช้จริง |
| `@testing-library/jest-dom` | matcher เพิ่ม เช่น `toBeInTheDocument()` |
| `@vitest/coverage-v8` | รายงาน coverage |
| `@vitest/ui` | หน้าเว็บดูผลเทสต์ |

> `@types/node` ต้องเป็น `^24` เพราะ Vitest 5 บังคับ peer เป็น `^22 || >=24`

### สองตัวที่คู่มือ Next.js บอกให้ลง แต่โปรเจกต์นี้ "ไม่ต้องลง"

1. **`@vitejs/plugin-react`** — เวอร์ชัน 6 ต้องการ `@babel/core@^8` แต่ `shadcn` ในโปรเจกต์นี้ดึง
   `@babel/core@7` มา ลงแล้ว `npm install` จะพังด้วย `ERESOLVE`
   ไม่ลงก็ไม่มีปัญหา เพราะ plugin นี้มีไว้ทำ Fast Refresh ตอน dev ซึ่งเทสต์ไม่ใช้
   ส่วน JSX นั้น Vite อ่าน `"jsx": "react-jsx"` จาก `tsconfig.json` แล้วแปลงให้เองอยู่แล้ว
2. **`vite-tsconfig-paths`** — Vite 8 อ่าน `paths` จาก `tsconfig.json` ได้เองผ่าน
   `resolve.tsconfigPaths: true` (ถ้าลงจริง Vitest จะเตือนให้ถอดออก)

---

## 3. สร้างไฟล์ตั้งค่า 2 ไฟล์

### `vitest.config.mts` (ไฟล์ใหม่ที่ root โปรเจกต์)

```ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    tsconfigPaths: true,          // ให้ @/… และ @generated/… ใช้ได้ในเทสต์
  },
  test: {
    environment: "jsdom",         // ค่าเริ่มต้นของทุกไฟล์: มี document/window
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}", "src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "generated/**", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/lib/**/*.ts", "src/app/(front)/components/**/*.tsx"],
      exclude: ["src/lib/prisma.ts", "src/lib/auth.ts", "src/lib/auth-client.ts"],
    },
  },
})
```

- นามสกุล `.mts` เพื่อให้ Node อ่านเป็น ESM แน่นอน ไม่ขึ้นกับ `"type"` ใน `package.json`
- `include` รับทั้งไฟล์ใน `tests/` และไฟล์ที่วางข้าง ๆ โค้ดใน `src/`
- `coverage.include` เจาะเฉพาะ logic ที่ทดสอบได้จริง ไม่นับ route / ไฟล์ generated ที่จะทำให้ตัวเลขเพี้ยน

### `vitest.setup.ts` (ไฟล์ใหม่ที่รากโปรเจกต์)

```ts
import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

afterEach(() => {
  if (typeof document !== "undefined") cleanup()
})
```

- บรรทัดแรกเสียบ matcher ของ jest-dom เข้า `expect` พร้อม type (ต้องเป็น `/vitest` ไม่ใช่ path เปล่า)
- โปรเจกต์นี้ **ไม่เปิด `globals: true`** จึงต้อง `import { describe, it, expect } from "vitest"` ทุกไฟล์
  และเพราะไม่มี global ทาง Testing Library จะไม่ล้าง DOM ให้อัตโนมัติ — ต้องเรียก `cleanup()` เอง
  ไม่งั้นเทสต์ก่อนหน้าจะทิ้ง DOM ค้างไว้จน `getByTestId` เจอ element ซ้ำสองตัว
- เช็ค `document` ก่อน เพราะไฟล์ setup นี้ถูกโหลดกับเทสต์ที่ใช้ `environment: node` ด้วย

---

## 4. เพิ่มคำสั่งใน `package.json`

ใน `"scripts"` เพิ่ม 5 บรรทัดนี้

```json
"test": "vitest run",
"test:watch": "vitest",
"test:ui": "vitest --ui",
"test:coverage": "vitest run --coverage",
"test:integration": "vitest run tests/integration"
```

| คำสั่ง | ทำอะไร |
|---|---|
| `npm test` | รันทุกเทสต์หนึ่งรอบแล้วจบ |
| `npm run test:watch` | รันค้างไว้ แก้โค้ดแล้วรันเฉพาะไฟล์ที่กระทบ (ใช้ตอนเขียนงาน) |
| `npm run test:ui` | เปิดหน้าเว็บดูผล/ไล่ดูเทสต์ทีละตัว |
| `npm run test:coverage` | รันพร้อมรายงาน coverage (`coverage/index.html`) |
| `npm run test:integration` | รันเฉพาะเทสต์ที่แตะฐานข้อมูลใน `tests/integration/` |

รันเฉพาะบางไฟล์หรือบางเคส

```bash
npx vitest run tests/unit/cart-logic.test.ts   # เจาะไฟล์เดียว
npx vitest run -t "บวกจำนวน"                    # เจาะตามชื่อเทสต์
```

---

## 5. วางไฟล์เทสต์ไว้ตรงไหน

```
tests/
├── hello.test.ts                 # เทสต์แรก ไม่ import อะไรจาก src เลย
├── unit/                         # ฟังก์ชันล้วน ไม่มี DOM ไม่มี DB
│   ├── format.test.ts
│   ├── cart-logic.test.ts
│   ├── product-params.test.ts
│   └── course-api.test.ts        # ฉีด fetch ปลอมเข้าไป
├── components/                   # React component + Testing Library
│   └── app-product-card.test.tsx
└── integration/                  # ต่อ SQLite จริงที่ prisma/test.db
    └── product-repository.test.ts
```

ชื่อไฟล์ต้องลงท้ายด้วย `.test.ts` (หรือ `.test.tsx` ถ้ามี JSX) ไม่งั้น Vitest จะไม่เห็น