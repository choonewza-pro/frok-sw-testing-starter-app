# HTTP & API Integration Testing

Techniques for testing Express, Fastify, Next.js App Router, and NestJS APIs with real middleware, routing, authentication, and database persistence.

---

## 1. Express / NestJS with Supertest

`supertest` dispatches HTTP requests directly into the application handler without needing to bind to an actual network port.

### Express Setup:
```typescript
import request from 'supertest'
import { app } from '../src/app' // Exported Express app (before app.listen)
import { createTestUser } from './factories/user.factory'
import { prisma } from '../src/lib/prisma'

describe('POST /api/v1/posts', () => {
  it('creates a new post when authenticated with valid token', async () => {
    // 1. Arrange — seed database
    const author = await createTestUser()
    const token = generateTestToken({ userId: author.id })

    const payload = {
      title: 'Building Scalable APIs',
      content: 'Detailed guide on integration testing...',
    }

    // 2. Act — dispatch request via supertest
    const response = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)

    // 3. Assert — HTTP response contract
    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      id: expect.any(String),
      title: 'Building Scalable APIs',
      authorId: author.id,
    })

    // 4. Assert — Persistent database state
    const postInDb = await prisma.post.findUnique({
      where: { id: response.body.id },
    })
    expect(postInDb).not.toBeNull()
    expect(postInDb?.content).toBe(payload.content)
  })
})
```

---

## 2. Fastify with `fastify.inject()`

Fastify provides a native, high-performance in-process injection mechanism via `inject()` (no external libraries needed).

```typescript
import { buildApp } from '../src/app'
import { FastifyInstance } from 'fastify'

describe('GET /api/v1/products/:id', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildApp()
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('returns 200 and product data when item exists', async () => {
    const product = await createTestProduct({ price: 150 })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/products/${product.id}`,
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json).toMatchObject({
      id: product.id,
      price: 150,
    })
  })
})
```

---

## 3. Next.js App Router (`app/api/**/route.ts`)

In Next.js App Router, Route Handlers are standard Web API functions accepting `Request` and returning `Response`. You can test them directly without running a Next.js server!

```typescript
// app/api/checkout/route.integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { POST } from './route'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/test/helpers/clean-db'
import { createTestUser } from '@/test/factories/user.factory'

describe('Next.js Route Handler: POST /api/checkout', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  it('creates order and returns 200 JSON response', async () => {
    const user = await createTestUser()

    // Construct Web Standard Request
    const req = new Request('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id, // Or session cookie header
      },
      body: JSON.stringify({
        productId: 'prod-123',
        quantity: 1,
      }),
    })

    // Execute route handler directly
    const res = await POST(req)

    // Assert Web Response
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)

    // Assert Database
    const order = await prisma.order.findFirst({ where: { userId: user.id } })
    expect(order).not.toBeNull()
  })
})
```

---

## 4. Authentication, Headers & Cookies

### Bearer Token Header:
```typescript
const res = await request(app)
  .get('/api/protected')
  .set('Authorization', `Bearer ${jwtToken}`)
```

### Cookie-based Sessions:
```typescript
// Capture cookie from login response
const loginRes = await request(app)
  .post('/api/auth/login')
  .send({ email: 'user@test.com', password: 'password' })

const cookies = loginRes.headers['set-cookie']

// Forward cookie to subsequent authenticated requests
const profileRes = await request(app)
  .get('/api/user/me')
  .set('Cookie', cookies)
```

---

## 5. Multipart File Uploads

Testing file uploads with `supertest`:

```typescript
it('uploads profile avatar image', async () => {
  const buffer = Buffer.from('fake-image-binary-data')

  const res = await request(app)
    .post('/api/users/avatar')
    .set('Authorization', `Bearer ${token}`)
    .attach('avatar', buffer, 'avatar.png')

  expect(res.status).toBe(200)
  expect(res.body.avatarUrl).toContain('/uploads/')
})
```
