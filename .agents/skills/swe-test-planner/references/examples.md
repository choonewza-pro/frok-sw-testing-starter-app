# Worked Example: swe-test-planner Output

This file shows a **complete, realistic output** from `swe-test-planner` for
a Next.js e-commerce project. Use this as the gold-standard reference for
output format, tone, and level of detail.

---

## Input Context

- **Project:** `nextjs-shop` — Next.js 14 App Router, TypeScript, Prisma, Stripe
- **Framework detected:** Next.js (found `next.config.ts`)
- **Git available:** Yes
- **Scan date:** 2026-09-16

---

## Full Output (what the agent should produce)

---

## 🔍 Risk-based Test Plan

**Project:** nextjs-shop
**Scanned:** 2026-09-16
**Git range:** Last 90 days (143 commits total)
**Features found:** 8
**Framework detected:** Next.js (App Router)

---

## 📊 Risk Table

| # | Feature | Impact | Likelihood | Risk Score | Zone | Existing Tests | Recommended Technique |
|---|---------|--------|------------|------------|------|---------------|-----------------------|
| 1 | Payment (Stripe checkout) | 5 | 5 | 25 | 🔴 Critical | ❌ | STT + EP |
| 2 | Auth (Login / JWT) | 5 | 4 | 20 | 🔴 Critical | ❌ | STT |
| 3 | Order Management | 4 | 4 | 16 | 🔴 Critical | ✅ | STT + BVA |
| 4 | Product Search & Filter | 3 | 4 | 12 | 🟠 High | ❌ | EP |
| 5 | Cart | 4 | 2 | 8 | 🟡 Medium | ✅ | EP + BVA |
| 6 | User Profile | 3 | 2 | 6 | 🟡 Medium | ❌ | EP |
| 7 | Notification (Email) | 3 | 1 | 3 | 🟢 Low | ❌ | EP |
| 8 | Landing Page / Static | 1 | 1 | 1 | 🟢 Low | ❌ | — |

**Zone legend:**
- 🔴 **Critical** (≥ 16) — test first, block release if missing
- 🟠 **High** (9–15) — test in current sprint
- 🟡 **Medium** (4–8) — test when capacity allows
- 🟢 **Low** (1–3) — defer or test last

---

> 💬 **Impact Review** — Scores assigned by keyword heuristics. Do any look wrong for your project?
> *(e.g. "Cart should be 5 because we're launching next week and it's the core flow")*

*(Agent asks via AskUserQuestion here — example assumes user replies "Looks correct — proceed")*

---

## 🎯 Recommended Testing Approach

### 🔴 Critical — Test Immediately

- **Payment (Stripe checkout)** — Has payment state machine (cart → pending → paid → refunded → failed)
  → use **State Transition Testing (STT)** for status flow.
  Also has amount validation (min/max), card type enum → add **EP** for those inputs.

- **Auth (Login / JWT)** — Has session state (anonymous → authenticated → expired → locked)
  → use **STT** for session transitions. Role enum (admin/user/guest) → **EP**.

- **Order Management** — Has order status workflow (draft → confirmed → shipped → delivered → cancelled)
  → use **STT**. Also has numeric constraints (quantity ≥ 1, price > 0) → **BVA**.

### 🟠 High — Test This Sprint

- **Product Search & Filter** — Category dropdown, price range filter, sort enum
  → use **EP** for each input type. No workflow detected.

### 🟡 Medium — Schedule for Next Sprint

- **Cart** — Item quantity (numeric range), product type (enum), coupon code (enum/text)
  → **BVA** for quantity, **EP** for product type and coupon.

- **User Profile** — Field validation (name, email format, phone format) → **EP**.

### 🟢 Low — Defer

- **Notification (Email)** and **Landing Page** have negligible risk.
  Test only if time permits after Critical + High are covered.

---

## 🔧 Technique Guide

| Technique | When to Use | swe-test-engineer keyword |
|-----------|-------------|--------------------------|
| **BVA** | Numeric/time inputs with ranges (age, amount, quantity, date) | "boundary value" |
| **EP** | Enum, dropdown, role, boolean, text type inputs | "equivalence partitioning" |
| **STT** | Status fields, approval flows, state machines | "state transition" |
| **Mixed** | Feature has both range inputs AND enum/workflow inputs | List each condition separately |

---

## ➡️ Next Steps

1. Start with 🔴 **Critical** features: Payment → Auth → Order
2. For each feature, activate **swe-test-engineer** and provide the requirement or spec
3. swe-test-engineer will generate Unit Test Cases + Business Test Cases using the recommended technique

**Handoff examples:**

> "Use swe-test-engineer: **Payment** — Stripe payment status: pending, processing, paid, failed, refunded.
> Transitions: pending → processing → paid, paid → refunded, any → failed. Invalid: paid → pending."

> "Use swe-test-engineer: **Auth** — User role: admin, user, guest (EP).
> Session state: anonymous → authenticated → expired → locked."

> "Use swe-test-engineer: **Order quantity** — numeric, min 1, max 999 (BVA)."

---

✅ Saved to `test-plan/risk-plan-2026-09-16.md`

---

## Notes on This Example

- **Payment Impact=5, Likelihood=5**: Stripe integration (external API +1), async webhook handler (+1),
  recent `fix: payment webhook retry` commit (+1), no test files found → base=3 from 18 commits + modifiers → 5
- **Cart Impact=4, Likelihood=2**: Only 3 commits in 90 days, has existing `cart.test.ts` (−1 modifier)
- **Landing Page Impact=1**: Matched keyword `landing` → Impact 1 immediately, no git activity
- **Notification Likelihood=1**: 0 commits in 90 days, falls in "Very Low" git bucket
