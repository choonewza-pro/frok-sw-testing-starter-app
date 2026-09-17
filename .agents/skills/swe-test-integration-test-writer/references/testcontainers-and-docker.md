# Testcontainers & Docker Infrastructure

Running real PostgreSQL, MySQL, Redis, and MongoDB containers for TypeScript integration tests.

---

## 1. Why Testcontainers Beats In-Memory Mocks

Many developers attempt to test PostgreSQL applications using SQLite in-memory (`better-sqlite3`). This creates severe false confidence:

| Feature | PostgreSQL (Production) | SQLite (In-Memory) | Risk of SQLite In-Memory |
|---|---|---|---|
| **JSON Operations** | `jsonb_extract_path`, `->>`, `@>` | Limited JSON1 extension | Queries fail in prod despite passing in test |
| **Concurrency** | Row-level locking (`FOR UPDATE`) | Table-level locking only | Concurrency bugs undetected |
| **Data Types** | `UUID`, `INET`, `TIMESTAMPTZ`, Arrays | Pure text/integer | Type casting regressions |
| **Full-Text Search** | `to_tsvector`, `ts_query` | Not supported | Search features cannot be tested |

> **Best Practice:** Always run the **exact same database engine** in integration tests that you run in production, managed dynamically via **Testcontainers** or **Docker Compose**.

---

## 2. Using `@testcontainers/postgresql` in Global Setup

Testcontainers allows the test runner to automatically start a containerized PostgreSQL instance on a dynamic open port before running tests, and tear it down after completion.

### Step 1: Install Dependencies
```bash
npm install -D @testcontainers/postgresql testcontainers
```

### Step 2: Global Setup Script (`src/test/global-setup.ts`)

```typescript
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { execSync } from 'child_process'

let container: StartedPostgreSqlContainer

export async function setup() {
  console.log('🚀 Starting test PostgreSQL container...')

  // Spin up real Postgres 16 on random available host port
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('app_test')
    .withUsername('test_user')
    .withPassword('test_pass')
    .start()

  const connectionUri = container.getConnectionUri()
  process.env.DATABASE_URL = connectionUri

  console.log(`✅ Postgres test container running at: ${connectionUri}`)

  // Run database migrations against the new container
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: connectionUri },
    stdio: 'inherit',
  })
}

export async function teardown() {
  console.log('🛑 Stopping test PostgreSQL container...')
  if (container) {
    await container.stop()
  }
}
```

### Step 3: Configure Vitest or Jest Global Setup

```typescript
// vitest.config.integration.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['./src/test/global-setup.ts'],
    testTimeout: 30000, // Container spin up may take ~5-10s initially
  },
})
```

---

## 3. Adding Redis via Testcontainers

If your application relies on Redis for caching, sessions, or queues:

```typescript
import { GenericContainer, StartedTestContainer } from 'testcontainers'

let redisContainer: StartedTestContainer

export async function setupRedis() {
  redisContainer = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .start()

  const host = redisContainer.getHost()
  const port = redisContainer.getMappedPort(6379)

  process.env.REDIS_URL = `redis://${host}:${port}`
}

export async function teardownRedis() {
  if (redisContainer) {
    await redisContainer.stop()
  }
}
```

---

## 4. Alternative: Docker Compose for Local & CI Pipelines

If Docker daemon permissions prevent dynamic Testcontainers (common in locked CI runners), use a dedicated `docker-compose.test.yml`:

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  test-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
      POSTGRES_DB: app_test
    ports:
      - '5433:5432' # Map to 5433 to avoid collision with local dev postgres
    tmpfs:
      - /var/lib/postgresql/data # High speed in-memory RAM disk for tests

  test-redis:
    image: redis:7-alpine
    ports:
      - '6380:6379'
```

### Running in CI / Local:

```bash
# 1. Start containers in background
docker compose -f docker-compose.test.yml up -d --wait

# 2. Run migrations
DATABASE_URL="postgresql://test_user:test_password@localhost:5433/app_test" npx prisma migrate deploy

# 3. Run integration tests
DATABASE_URL="postgresql://test_user:test_password@localhost:5433/app_test" npm run test:integration

# 4. Tear down containers
docker compose -f docker-compose.test.yml down -v
```
