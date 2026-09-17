# Database Lifecycle & State Management

Managing test database migrations, state cleanup strategies, multi-worker concurrency, safety guards, and teardown hygiene.

---

## 1. Environment Safety Guard (Zero-Accident Rule)

Before any migration or test cleanup executes, the test runner MUST verify that the active database is indeed a test database.

```typescript
// src/test/helpers/safety-guard.ts
export function assertSafeTestEnvironment() {
  const nodeEnv = process.env.NODE_ENV
  const dbUrl = process.env.DATABASE_URL || ''

  if (nodeEnv !== 'test') {
    throw new Error(
      `FATAL SAFETY VIOLATION: NODE_ENV is '${nodeEnv}', expected 'test'. Halting tests to protect database!`
    )
  }

  // Reject URLs pointing to production or staging domains
  const dangerousPatterns = ['prod', 'production', 'staging', 'live', 'rds.amazonaws.com', 'supabase.co']
  const isDangerous = dangerousPatterns.some((pattern) => dbUrl.toLowerCase().includes(pattern))

  if (isDangerous && !dbUrl.includes('test')) {
    throw new Error(
      `FATAL SAFETY VIOLATION: DATABASE_URL appears to target a non-test database (${dbUrl}). Execution aborted!`
    )
  }
}
```

Invoke `assertSafeTestEnvironment()` at the very top of global test setup.

---

## 2. Pre-Test Database Migration

The test database must match the current application schema before any tests execute:

- **Prisma:**
  ```bash
  npx prisma migrate deploy
  # OR generate fresh schema directly on test container
  npx prisma db push --skip-generate
  ```
- **Drizzle:**
  ```typescript
  import { migrate } from 'drizzle-orm/node-postgres/migrator'
  await migrate(db, { migrationsFolder: './drizzle' })
  ```
- **TypeORM:**
  ```typescript
  await dataSource.runMigrations()
  ```

Run migrations once in **global setup** (`globalSetup.ts`), not inside individual test files.

---

## 3. Database Cleanup Strategies (No Test Pollution)

Tests must be independent: data created in Test A must not affect Test B.

### Strategy A: Fast Table Truncation (Recommended)

Cleans all dynamic tables while preserving schema and static lookup tables. Runs in `beforeEach` or `afterEach`.

#### PostgreSQL (Prisma Example):

```typescript
// src/test/helpers/clean-db.ts
import { prisma } from '../../lib/prisma'

export async function cleanDatabase() {
  // Query all user table names in the public schema
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables 
    WHERE schemaname='public' 
      AND tablename NOT IN ('_prisma_migrations', 'spatial_ref_sys');
  `

  const tables = tablenames
    .map(({ tablename }) => `"${tablename}"`)
    .join(', ')

  if (tables.length > 0) {
    // Truncate all tables in one atomic statement with cascade
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`)
  }
}
```

#### Usage in Tests:

```typescript
beforeEach(async () => {
  await cleanDatabase()
})
```

---

### Strategy B: Transaction Rollback

Wrap each test case in a database transaction and roll it back after assertion.

```typescript
describe('UserService (Transaction Rollback)', () => {
  let txClient: PrismaClient

  beforeEach(async () => {
    // Note: requires custom transaction wrapper or ORM rollback support
    // All test operations execute inside txClient
  })

  afterEach(async () => {
    // Rollback transaction — zero disk write persistence
  })
})
```

#### Comparison:

| Strategy | Speed | Isolation | Caveats |
|---|---|---|---|
| **Table Truncate** | ~20–50ms | 100% Guaranteed | Must execute raw SQL truncate |
| **Transaction Rollback** | ~2–5ms | Memory rollback | Cannot test nested transactions or endpoints that commit transactions internally |

> **Recommendation:** Use **Table Truncation** as the default. It reliably supports asynchronous background jobs, multi-table transactions, and real HTTP handlers.

---

## 4. Multi-Worker Concurrency & Collision Prevention

Modern test runners (Vitest, Jest) run test files in parallel across multiple worker threads or processes. If two workers run `TRUNCATE TABLE` on the same database simultaneously, tests fail unpredictably.

### Option A: Single-Thread Execution for Integration Suite (Simple & Stable)

Configure your integration test script to run sequentially:

- **Vitest:** `vitest run --config vitest.config.integration.ts --no-threads`
- **Jest:** `jest --config jest.integration.json --runInBand`

This is the easiest and most reliable setup for most projects.

### Option B: Isolated Schema per Worker (High Performance)

Give each worker thread its own private PostgreSQL schema:

```typescript
// vitest.config.integration.ts
export default defineConfig({
  test: {
    poolOptions: {
      threads: {
        maxThreads: 4,
      },
    },
    setupFiles: ['./src/test/setup-worker-schema.ts'],
  },
})
```

```typescript
// src/test/setup-worker-schema.ts
import { beforeAll, afterAll } from 'vitest'
import { prisma } from '../lib/prisma'

const workerId = process.env.VITEST_POOL_ID || '0'
const schemaName = `test_worker_${workerId}`

beforeAll(async () => {
  // Set current worker search_path to isolated schema
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`)
  await prisma.$executeRawUnsafe(`SET search_path TO "${schemaName}";`)
})

afterAll(async () => {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`)
})
```

---

## 5. Teardown Hygiene (Preventing CI Hangs)

Jest and Vitest hang indefinitely in CI if database connection pools, Redis clients, or HTTP listeners remain open.

Always disconnect clients and close pools in `afterAll`:

```typescript
// src/test/setup.ts
import { afterAll } from 'vitest'
import { prisma } from '../lib/prisma'
import { redisClient } from '../lib/redis'

afterAll(async () => {
  // 1. Disconnect Prisma connection pool
  await prisma.$disconnect()

  // 2. Disconnect Redis client if present
  if (redisClient?.isOpen) {
    await redisClient.quit()
  }
})
```

Run Jest with `--detectOpenHandles` to identify unclosed resources when debugging.
