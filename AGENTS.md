<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Setup

```bash
cp .env.example .env        # DATABASE_URL already points at file:./prisma/dev.db
npm install
npx prisma generate         # generates to generated/prisma/ (gitignored)
npx prisma db push          # creates prisma/dev.db
npm run dev
```

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Lint | `npm run lint` |
| Build | `npm run build` |

No test framework is configured. No CI workflows exist.

## Architecture

- **Framework**: Next.js 16.3.5 + React 19 (App Router)
- **Database**: SQLite via Prisma 7 (`@prisma/adapter-better-sqlite3`); file at `prisma/dev.db`
- **Auth**: Better Auth with email/password (`src/lib/auth.ts`, `src/lib/auth-client.ts`)
- **UI**: shadcn (radix-rhea style, lucide icons) + Tailwind CSS v4
- **State**: Zustand (`src/lib/cart-store.ts`)

## Prisma Gotchas

Prisma client outputs to `generated/prisma/`, **not** `node_modules/.prisma/client`. The import path is:

```ts
import prisma from "../../generated/prisma/client"  // relative, not @prisma/client
```

Always run `npx prisma generate` after schema changes. The `generated/prisma/` directory is gitignored.

## Route Groups

- `src/app/(auth)/` — login and signup pages
- `src/app/(front)/` — public-facing pages (home, products, cart, courses, etc.)
- `src/app/admin/` — admin dashboard and product management (role-gated, own layout)
- `src/app/api/auth/[...all]/` — Better Auth API catch-all
- `src/app/api/admin/` — admin Route Handlers (stats, revenue, orders, products, categories)

## Key Conventions

- Path alias: `@/*` → `./src/*`
- Thai language UI (`lang="th", Prompt font for Thai text)
- `export const instant = false` in front layout opts out of Next.js cache components
- Database tables use lowercase snake_case; auth models (User, Session, Account) use PascalCase
- `cacheComponents: true` enabled in `next.config.ts`
