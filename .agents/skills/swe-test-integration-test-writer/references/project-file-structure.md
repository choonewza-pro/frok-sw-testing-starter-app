# Project File Structure & CI Configuration

Organizing integration tests, configuring dedicated Vitest/Jest runners, and setting up CI pipeline stages.

---

## 1. Directory Organization Patterns

Choose one of two patterns based on existing project conventions:

### Pattern A: Co-location (Recommended for Domain/Feature Modules)
Keep integration tests adjacent to feature modules for immediate discoverability:

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.service.test.ts             # Fast unit test
│   │   └── auth.integration.test.ts         # Sociable integration test
│   └── orders/
│       ├── order.controller.ts
│       ├── order.service.ts
│       └── order.integration.test.ts        # Sociable integration test
└── test/
    ├── factories/                           # Test data factories
    │   ├── user.factory.ts
    │   └── order.factory.ts
    ├── helpers/
    │   ├── clean-db.ts                      # DB truncate script
    │   ├── safety-guard.ts                  # Safety check
    │   └── wait-for.ts                      # Polling helper
    ├── mocks/
    │   └── server.ts                        # MSW network mock server
    └── setup-integration.ts                 # Global setup/teardown
```

### Pattern B: Centralized `tests/integration/`
Common in monolithic or legacy codebases:

```
src/
└── ...
tests/
├── unit/
└── integration/
    ├── auth/
    │   └── login.integration.test.ts
    ├── orders/
    │   └── checkout.integration.test.ts
    ├── factories/
    └── setup.ts
```

---

## 2. Dedicated Runner Configuration

Never mix integration test configurations with unit test configurations. Integration tests require longer timeouts, global container setups, and single-threaded execution.

### Vitest Configuration (`vitest.config.integration.ts`):

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    name: 'integration',
    include: ['src/**/*.integration.test.ts', 'tests/integration/**/*.test.ts'],
    setupFiles: ['./src/test/setup-integration.ts'],
    globalSetup: ['./src/test/global-setup.ts'], // Spins up Testcontainers
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false, // Prevents multi-worker database collision
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Jest Configuration (`jest.integration.config.js`):

```javascript
module.exports = {
  displayName: 'integration',
  testMatch: ['**/*.integration.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup-integration.ts'],
  globalSetup: '<rootDir>/src/test/global-setup.ts',
  globalTeardown: '<rootDir>/src/test/global-teardown.ts',
  testTimeout: 20000,
  maxWorkers: 1, // Equivalent to --runInBand (avoids DB collision)
}
```

---

## 3. `package.json` Scripts

Define explicit commands separating fast unit tests from heavier integration tests:

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "vitest run --exclude '**/*.integration.test.ts'",
    "test:integration": "vitest run --config vitest.config.integration.ts",
    "test:integration:watch": "vitest watch --config vitest.config.integration.ts"
  }
}
```

---

## 4. CI/CD Pipeline Separation (GitHub Actions Example)

Run unit tests and integration tests in distinct stages for fast feedback:

```yaml
# .github/workflows/test.yml
name: CI Test Suite

on: [push, pull_request]

jobs:
  unit-test:
    name: Unit Tests (Fast)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run test:unit # Runs in 5 seconds, zero Docker dependency

  integration-test:
    name: Integration Tests (Real DB)
    needs: unit-test # Only run if unit tests pass!
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: app_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/app_test
      - run: npm run test:integration
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/app_test
```
