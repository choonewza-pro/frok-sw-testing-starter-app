# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands (supplements AGENTS.md)

No test framework is configured — Vitest and Testing Library were removed deliberately; do not re-add them unless asked.

| Task | Command |
|------|---------|
| Push schema to DB | `npx prisma db push` |
| Seed demo data | `node -e "const D=require('better-sqlite3'),f=require('fs');new D('prisma/dev.db').exec(f.readFileSync('docs/insert_data_ecom_example_50_products.sql','utf8'))"` |

Installed versions differ from what AGENTS.md states: Next 16.3.5, React 19.3.0, Prisma 7.10.0 (CLI + client + adapter all pinned to the same version — keep them in lockstep). `prisma@latest` currently resolves to `8.0.0-rc.15`, but `@prisma/client` has no 8.0.0 release, so do **not** take that upgrade prompt.

**Restart `next dev` after `prisma db push`.** `db push` can replace the SQLite file; a running dev server keeps a handle on the old inode, so writes appear to succeed while reads return nothing.

## Architecture notes

**No shared root layout.** `src/app/(auth)/layout.tsx` and `src/app/(front)/layout.tsx` each render their own `<html>`/`<body>` — there is no `src/app/layout.tsx`. Fonts (Prompt/Roboto/Lora), `globals.css`, and metadata are duplicated per group by design; a change to global chrome must be applied in both.

**Cache Components opt-out.** `cacheComponents: true` is on in `next.config.ts`, and both layouts plus `product/` and `course/` pages carry `export const instant = false` with a TODO to migrate. Dynamic data pages also call `await connection()` before reading `searchParams` (see `src/app/(front)/product/page.tsx`). New routes should follow the same pattern until the Cache Components migration happens.

**Database is SQLite** (`prisma/dev.db`, gitignored), via the `@prisma/adapter-better-sqlite3` driver adapter. `DATABASE_URL="file:./prisma/dev.db"` is resolved relative to `process.cwd()`, so commands must run from the repo root. Ported from MariaDB, so watch for leftovers: SQLite has no enums (`orders.status` is a plain `String`), no native type attributes (`@db.Text`/`@db.VarChar` were all dropped), and no index prefix lengths.

**Prisma schema is two worlds.** Better Auth models (`User`, `Session`, `Account`, `Verification`) are PascalCase with `@@map` to lowercase tables; the e-commerce models (`products`, `categories`, `orders`, `order_items`, `product_images`, `customers`) were introspected from the original MySQL schema and keep raw snake_case names. Don't rename the introspected models — the seed SQL in `docs/` inserts by those exact names. The datasource block has no `url`; the connection string is injected by `prisma.config.ts` from `.env`.

**DB client.** `src/lib/prisma.ts` is a `globalThis` singleton using `PrismaBetterSqlite3` (note: the adapter takes `{ url }`, not a bare string) and imports from `../../generated/prisma/client`. Import it as `@/lib/prisma` (default export) from app code rather than touching `generated/` directly.

**Auth.** `src/lib/auth.ts` (server, `prismaAdapter` with `provider: "sqlite"`, email/password, `autoSignIn: false`, min 8 chars) is consumed server-side via `auth.api.getSession({ headers: await headers() })` — see `src/components/navbar.tsx`. Client flows use `authClient` from `src/lib/auth-client.ts` (`signIn.email`, `signOut`), which posts to the catch-all at `src/app/api/auth/[...all]/route.ts`. After sign-out, call `router.refresh()` so the server-rendered Navbar re-reads the session.

The auth models must stay in sync with what Better Auth actually writes — verify with `npx @better-auth/cli generate --config src/lib/auth.ts --output <tmp>` and diff against `prisma/schema.prisma`, rather than adding fields by hand. A required column Better Auth does not write fails every signup with `Argument '<field>' is missing`. `User.role` is the one intentional extra; it is safe only because it has a `@default`.

Two Better Auth behaviours look like bugs but are not: signing up with an existing email returns `200` with a synthetic user and `token: null` (anti-enumeration), and state-changing routes reject requests without an `Origin` header (`MISSING_OR_NULL_ORIGIN`).

**Cart.** Zustand + `persist` in `src/lib/cart-store.ts`, localStorage key `skill-cart`. `totalItems`/`totalPrice` are selector functions, not stored fields. Any component reading it must be a Client Component, and the server-rendered Navbar wraps `CountCartItem` in `<Suspense>` to avoid hydration mismatch.

**Forms.** The pattern is react-hook-form + `zodResolver` + a Zod schema, with shadcn `Field`/`FieldError` for markup. Validation schemas that are shared between client and Server Action live in `src/lib/` (`contact-schema.ts`) and are re-validated inside the action (`src/app/(front)/contact/actions.ts`, which also has a `website` honeypot field and sends mail via the Resend REST API — no SDK).

**Images.** `product/page.tsx` checks `existsSync` against `public/product-image/` before trusting `product_images.image_name`, so a missing file degrades instead of 404-ing. Remote images are allow-listed in `next.config.ts` (`www.fffuel.co`, `api.codingthailand.com`).

**Components split.** `src/components/` holds shared/shadcn UI (`ui/` is generated by shadcn, radix-rhea style — regenerate rather than hand-edit). `src/app/(front)/components/` holds components scoped to the front route group.

## Environment

`.env` needs `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and — for the contact form to actually send — `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL`. Without the Resend trio the contact action returns a Thai error message instead of throwing.
