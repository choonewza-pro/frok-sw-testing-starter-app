# Test Fixtures & Factories

Building deterministic test data, managing foreign-key relationships, and avoiding hardcoded ID collisions in integration tests.

---

## 1. Why Factories Beat Static JSON Fixtures

Many test suites rely on static seed files (`users.json`, `seed.sql`) containing hardcoded values like:
```json
{ "id": 1, "email": "admin@example.com" }
```

### The Pitfalls of Static JSON:
1. **Primary Key Collisions:** If Test A and Test B both insert user `id: 1`, one will fail due to unique constraint violations.
2. **Brittle Schema Maintenance:** When adding a new non-null column (`phoneNumber`), you must manually update 50 JSON fixtures.
3. **Hidden Dependencies:** Tests secretly rely on records inserted 3 test files earlier.

> **Best Practice:** Use **Factory Functions** in TypeScript. Factories generate fresh, dynamic, valid data with sensible defaults while allowing per-test overrides.

---

## 2. In-Memory vs Persistent Factories

A good factory architecture provides two helper levels:

1. **`build*` (In-Memory Data):** Returns a typed JavaScript object with random valid values (does not write to DB).
2. **`create*` (Persistent Record):** Writes the entity directly to the test database via Prisma/Drizzle.

### User Factory Example:

```typescript
// src/test/factories/user.factory.ts
import { prisma } from '../../lib/prisma'
import { User, Role } from '@prisma/client'
import crypto from 'crypto'

/**
 * Builds an in-memory user payload without DB insertion
 */
export function buildUser(overrides: Partial<User> = {}): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
  const uniqueSuffix = crypto.randomUUID().slice(0, 8)
  return {
    email: `test-user-${uniqueSuffix}@example.com`,
    name: `Test User ${uniqueSuffix}`,
    role: Role.MEMBER,
    isActive: true,
    passwordHash: '$2b$10$epOZ9Gz...', // Pre-computed bcrypt hash for 'Password123!'
    ...overrides,
  }
}

/**
 * Persists a user into the real test database
 */
export async function createTestUser(overrides: Partial<User> = {}): Promise<User> {
  const data = buildUser(overrides)
  return prisma.user.create({
    data,
  })
}
```

---

## 3. Handling Complex Relationships & Foreign Keys

Integration tests frequently require parent-child entity hierarchies (e.g. `User` → `Store` → `Product` → `Order`).

Factories should automatically create missing parents if not provided:

```typescript
// src/test/factories/order.factory.ts
import { prisma } from '../../lib/prisma'
import { createTestUser } from './user.factory'
import { createTestProduct } from './product.factory'
import { Order, OrderStatus } from '@prisma/client'

interface CreateOrderOptions {
  userId?: string
  status?: OrderStatus
  items?: Array<{ productId: string; quantity: number; price: number }>
}

export async function createTestOrder(options: CreateOrderOptions = {}): Promise<Order> {
  // If userId is not supplied, create a fresh user on the fly!
  const userId = options.userId ?? (await createTestUser()).id

  // If no items are supplied, create a default product on the fly!
  const items = options.items ?? [
    {
      productId: (await createTestProduct()).id,
      quantity: 1,
      price: 500,
    },
  ]

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return prisma.order.create({
    data: {
      userId,
      status: options.status ?? OrderStatus.PENDING,
      totalAmount,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
    include: { items: true },
  })
}
```

---

## 4. Usage in Integration Tests

With factories, test arrange phases become clean, descriptive, and collision-free:

```typescript
it('cancels pending order and restores product stock', async () => {
  // Arrange — build realistic relational data in 2 lines
  const user = await createTestUser()
  const product = await createTestProduct({ stock: 5 })
  const order = await createTestOrder({
    userId: user.id,
    items: [{ productId: product.id, quantity: 2, price: 100 }],
  })

  // Act
  const res = await request(app)
    .post(`/api/orders/${order.id}/cancel`)
    .set('Authorization', `Bearer ${user.token}`)

  // Assert
  expect(res.status).toBe(200)

  // Verify DB state
  const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } })
  expect(updatedProduct?.stock).toBe(7) // 5 + 2 restored
})
```
