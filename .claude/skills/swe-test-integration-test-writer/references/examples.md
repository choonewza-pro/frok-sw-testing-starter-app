# Integration Testing Examples

Complete, end-to-end runnable integration test examples for common TypeScript tech stacks.

---

## Example 1: Express + Prisma + PostgreSQL

A complete integration test verifying user registration:
- Dispatches HTTP request via `supertest`
- Traverses real Express routers, validation middleware, and auth services
- Persists to real PostgreSQL via Prisma
- Asserts HTTP response contract AND database state
- Verifies password hashing in database
- Tests 409 Conflict when duplicate email is registered

```typescript
// src/modules/auth/register.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../../app'
import { prisma } from '../../lib/prisma'
import { cleanDatabase } from '../../test/helpers/clean-db'
import { createTestUser } from '../../test/factories/user.factory'
import bcrypt from 'bcrypt'

describe('POST /api/v1/auth/register', () => {
  beforeEach(async () => {
    // Reset database to pristine state before each test
    await cleanDatabase()
  })

  afterAll(async () => {
    // Cleanly close connection pool to prevent CI hang
    await prisma.$disconnect()
  })

  it('registers user, stores hashed password in database, and returns 201 with JWT', async () => {
    // Arrange
    const payload = {
      email: 'alex.developer@example.com',
      password: 'SuperSecretPassword123!',
      name: 'Alex Developer',
    }

    // Act — real HTTP dispatch
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(payload)

    // Assert 1 — HTTP Contract
    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      token: expect.any(String),
      user: {
        id: expect.any(String),
        email: 'alex.developer@example.com',
        name: 'Alex Developer',
      },
    })
    // Security check: raw password or hash must NEVER leak to response body
    expect(response.body.user.password).toBeUndefined()
    expect(response.body.user.passwordHash).toBeUndefined()

    // Assert 2 — Real Database State Verification
    const savedUser = await prisma.user.findUnique({
      where: { email: 'alex.developer@example.com' },
    })
    expect(savedUser).not.toBeNull()
    expect(savedUser?.name).toBe('Alex Developer')

    // Verify password was properly hashed using bcrypt
    const isPasswordHashed = await bcrypt.compare(payload.password, savedUser!.passwordHash)
    expect(isPasswordHashed).toBe(true)
  })

  it('returns 409 Conflict when email is already registered in database', async () => {
    // Arrange — seed existing user in DB
    await createTestUser({ email: 'duplicate@example.com' })

    const payload = {
      email: 'duplicate@example.com',
      password: 'AnotherPassword456!',
      name: 'Duplicate User',
    }

    // Act
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(payload)

    // Assert
    expect(response.status).toBe(409)
    expect(response.body).toMatchObject({
      error: 'ConflictError',
      message: expect.stringContaining('already exists'),
    })

    // Verify only 1 record exists in DB
    const count = await prisma.user.count({ where: { email: 'duplicate@example.com' } })
    expect(count).toBe(1)
  })
})
```

---

## Example 2: Next.js App Router + Drizzle ORM + MSW Stripe

A complete integration test for a Next.js App Router API Route (`app/api/checkout/route.ts`):
- Uses Web Standard `Request` and `Response`
- Intercepts external Stripe API via MSW (`msw/node`)
- Persists order and items to PostgreSQL via Drizzle ORM
- Verifies transaction rollback on card decline

```typescript
// app/api/checkout/route.integration.test.ts
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import { POST } from './route'
import { db } from '@/lib/db'
import { orders, orderItems } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { cleanDatabase } from '@/test/helpers/clean-db'
import { createTestUser } from '@/test/factories/user.factory'
import { createTestProduct } from '@/test/factories/product.factory'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('Next.js API Route: POST /api/checkout', () => {
  beforeAll(() => {
    server.listen()
  })

  beforeEach(async () => {
    await cleanDatabase()
    server.resetHandlers()
  })

  afterAll(async () => {
    server.close()
  })

  it('charges card via Stripe, persists order in DB, and returns 200', async () => {
    // Arrange — seed real DB records
    const user = await createTestUser()
    const product = await createTestProduct({ price: 2500, stock: 10 })

    // Mock successful Stripe charge via MSW
    server.use(
      http.post('https://api.stripe.com/v1/payment_intents', () => {
        return HttpResponse.json({
          id: 'pi_test_987654',
          status: 'succeeded',
          amount: 2500,
        })
      })
    )

    // Construct Web Request
    const request = new Request('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`,
      },
      body: JSON.stringify({
        productId: product.id,
        quantity: 1,
        paymentMethodId: 'pm_card_visa',
      }),
    })

    // Act — execute Next.js route handler directly
    const response = await POST(request)

    // Assert HTTP Response
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toMatchObject({
      success: true,
      orderId: expect.any(String),
      status: 'PAID',
    })

    // Assert Database State via Drizzle
    const savedOrder = await db.query.orders.findFirst({
      where: eq(orders.id, json.orderId),
      with: { items: true },
    })

    expect(savedOrder).toBeDefined()
    expect(savedOrder?.status).toBe('PAID')
    expect(savedOrder?.stripePaymentIntentId).toBe('pi_test_987654')
    expect(savedOrder?.items).toHaveLength(1)
    expect(savedOrder?.items[0].productId).toBe(product.id)
  })

  it('returns 402 and leaves zero pending orders in DB when card is declined', async () => {
    const user = await createTestUser()
    const product = await createTestProduct({ price: 1000 })

    // Mock Stripe decline
    server.use(
      http.post('https://api.stripe.com/v1/payment_intents', () => {
        return HttpResponse.json(
          { error: { message: 'Card declined: insufficient funds' } },
          { status: 402 }
        )
      })
    )

    const request = new Request('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`,
      },
      body: JSON.stringify({
        productId: product.id,
        quantity: 1,
        paymentMethodId: 'pm_card_declined',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(402)

    // Assert database has NO confirmed/paid orders
    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, user.id),
    })
    expect(userOrders.filter((o) => o.status === 'PAID')).toHaveLength(0)
  })
})
```
