# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands (supplements AGENTS.md)

No test framework is configured — Vitest and Testing Library were removed deliberately; do not re-add them unless asked.

| Task | Command |
|------|---------|
| Push schema to DB | `npx prisma db push` |
| Build/reset the test DB | `npm run db:test:setup` (add `--empty` via `node scripts/setup-test-db.mjs --empty`) |
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

**Cart.** Pure logic lives in `src/lib/cart/cart-logic.ts` (`addItem`/`removeItem`/`updateQty`/`totalItems`/`totalPrice`/`lineTotal` — all take an item array and return a new one). `src/lib/cart/cart-store.ts` only holds state: it exports `createCartStore(options)` (pass `storage: null` for an isolated, non-persisting instance) and the app singleton `useCartStore`, Zustand + `persist` on localStorage key `skill-cart`. `totalItems`/`totalPrice` are selector functions, not stored fields. `CartItem.productId` is a `number` (matches `products.id`). Any component reading the store must be a Client Component; `CountCartItem` uses `useSyncExternalStore` with a server snapshot of `0`, so it renders `0` on the server and the real count after hydration.

**Forms.** The pattern is react-hook-form + `zodResolver` + a Zod schema, with shadcn `Field`/`FieldError` for markup. Schemas never live inside a page component — they sit in `src/lib/` (`contact-schema.ts`, `auth-schema.ts`) so they can be exercised without rendering a form.

**Layering for testability.** Route files are thin; everything worth testing is a plain function in `src/lib/` with its dependencies passed in:
- `src/lib/product/` — `product-params.ts` (parse `searchParams`, `PRODUCT_PAGE_SIZE`, `calcTotalPages`/`calcSkip`), `product-repository.ts` (takes a `PrismaClient` argument, so an integration test can point it at another DB file), `product-view-model.ts` (takes an `ImageExists` function instead of calling `existsSync` itself), `product-image.ts` (the real filesystem checker, server-only), `product-url.ts` (`buildProductUrl`), `product-service.ts` (composes all of the above).
- `src/lib/course/` — `course-api.ts` (`fetchCourses({ fetchImpl })`, validates against `course-schema.ts` and throws `CourseApiError`); the page renders the error instead of crashing. The endpoint comes from `resolveCourseApiUrl(env)`, so `COURSE_API_URL` in `.env` points it at a mock server; `docs/fixtures/courses.json` is a trimmed real response.
- `src/lib/contact/` — `contact-service.ts` holds the whole flow (`handleContactSubmission`, no `"use server"`), with `honeypot.ts`, `contact-config.ts` (`getContactEmailConfig(env)`) and `email-sender.ts` (`ContactEmailSender` port + `createResendEmailSender`) as the injectable pieces. `src/app/(front)/contact/actions.ts` only wires the real dependencies. Mail goes through the Resend REST API — no SDK.
- `src/types/` — `cart.ts`, `product.ts`, `course.ts`. Use these instead of `any`; `ProductViewModel.picture` is already `null` when the file is missing, so components never re-check.

**E2E selectors.** Every interactive element a test would reach carries `data-testid` — product/cart (`product-search-input`, `product-card`, `add-to-cart`, `cart-row`, `cart-total`, `cart-checkout`, `cart-count`), course (`course-card`, `course-error`), auth (`login-email`, `login-password`, `login-submit`, `signup-*`, `logout-button`, `nav-user-name`) and contact (`contact-name`, `contact-message`, `contact-submit`, `contact-success`, `contact-error`). Add one when adding an element rather than falling back to Thai display text, which changes. The inputs also keep their `id` (needed for `<label htmlFor>`); the testid is the selector, the id is for accessibility.

**Test database.** `scripts/setup-test-db.mjs` builds `prisma/test.db` (gitignored by `prisma/*.db`) with `prisma db push --url` plus the seed SQL, leaving `prisma/dev.db` untouched. Integration tests construct their own `PrismaClient` against it and pass it in — never reuse the `@/lib/prisma` singleton, which is bound to `DATABASE_URL` at import time.

**Path aliases.** `@/*` → `src/*` and `@generated/*` → `generated/*`. Import the Prisma client type as `@generated/prisma/client` (still not `@prisma/client` — the generated output is what matters), so files outside `src/` don't need `../../../` chains.

**Images.** `product/page.tsx` checks `existsSync` against `public/product-image/` before trusting `product_images.image_name`, so a missing file degrades instead of 404-ing. Remote images are allow-listed in `next.config.ts` (`www.fffuel.co`, `api.codingthailand.com`).

**Components split.** `src/components/` holds shared/shadcn UI (`ui/` is generated by shadcn, radix-rhea style — regenerate rather than hand-edit). `src/app/(front)/components/` holds components scoped to the front route group.

## Environment

`.env` needs `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and — for the contact form to actually send — `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL`. Without the Resend trio the contact action returns a Thai error message instead of throwing.
