# External 3rd-Party Mocking (MSW & Network Boundaries)

How to isolate external 3rd-party dependencies at the network level without mocking internal application code.

---

## 1. Network Boundary Mocking vs Internal Mocking

In integration tests, your application code (Axios, Fetch, SDK clients, error handlers) should run **completely real**. 

Instead of using `vi.mock('./payment-service')`, intercept the HTTP traffic at the network socket layer using **Mock Service Worker (MSW)**.

```
┌────────────────────────────────────────────────────────┐
│ Your Application Code (100% Real)                      │
│                                                        │
│ [Order Controller] ──► [Payment Service] ──► [Axios]   │
└───────────────────────────────────────────────────┬────┘
                                                    │ Outgoing HTTP
                                          ┌─────────▼────────┐
                                          │ MSW (msw/node)   │  ◄── Network Interceptor
                                          └─────────┬────────┘
                                                    │
                                         Fake Stripe 200 OK / 402 Card Error
```

### Benefits:
1. Real URL construction, headers, authentication keys, and serializations are verified.
2. Resilience: If you switch from Axios to Fetch or upgrade a client library, your integration test remains valid.

---

## 2. MSW Setup for Integration Tests

### Step 1: Install MSW
```bash
npm install -D msw
```

### Step 2: Define Server & Handlers (`src/test/mocks/server.ts`)

```typescript
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock Stripe charge endpoint
  http.post('https://api.stripe.com/v1/charges', async ({ request }) => {
    return HttpResponse.json({
      id: 'ch_test_123456',
      status: 'succeeded',
      amount: 5000,
      currency: 'usd',
    })
  }),

  // Mock Twilio SMS endpoint
  http.post('https://api.twilio.com/2010-04-01/Accounts/:account/Messages.json', () => {
    return HttpResponse.json({ sid: 'SM_test_789', status: 'queued' })
  }),
]

export const server = setupServer(...handlers)
```

### Step 3: Lifecycle Integration in Test Setup (`src/test/setup.ts`)

```typescript
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server'

// Start server before integration tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' }) // Fail test if unmocked 3rd-party request occurs
})

// Reset any per-test handler overrides
afterEach(() => {
  server.resetHandlers()
})

// Clean up after all tests
afterAll(() => {
  server.close()
})
```

---

## 3. Overriding Responses for Specific Tests (Failure Modes)

You can easily simulate 3rd-party downtime, rate limits, or card declines within an individual test block:

```typescript
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

it('handles Stripe card decline gracefully without charging customer', async () => {
  // Override handler specifically for this test case
  server.use(
    http.post('https://api.stripe.com/v1/charges', () => {
      return HttpResponse.json(
        {
          error: {
            message: 'Your card has insufficient funds.',
            code: 'card_declined',
          },
        },
        { status: 402 }
      )
    })
  )

  const res = await request(app)
    .post('/api/checkout')
    .set('Authorization', `Bearer ${token}`)
    .send({ orderId: 'ord-123' })

  // Assert API reports failure
  expect(res.status).toBe(402)
  expect(res.body.message).toContain('insufficient funds')

  // Assert Order status in DB was marked as PAYMENT_FAILED
  const order = await prisma.order.findUnique({ where: { id: 'ord-123' } })
  expect(order?.status).toBe('PAYMENT_FAILED')
})
```

---

## 4. Simulating Network Timeouts & Delays

Test how your system behaves when an external dependency hangs:

```typescript
import { delay } from 'msw'

it('aborts and returns 504 when payment gateway times out', async () => {
  server.use(
    http.post('https://api.stripe.com/v1/charges', async () => {
      await delay(10000) // Delay 10 seconds to trigger application HTTP client timeout
      return HttpResponse.json({ status: 'succeeded' })
    })
  )

  const res = await request(app).post('/api/checkout').send(payload)
  expect(res.status).toBe(504) // Gateway Timeout handled cleanly
})
```
