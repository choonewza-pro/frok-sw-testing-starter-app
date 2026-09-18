# TEST_1.7 Admin Dashboard (P1, Risk 12 High)

* Route: `/admin` (`src/app/admin/page.tsx`, `DashboardClient.tsx:16`)
* Spec: `e2e/admin-dashboard.spec.ts` — `storageState: admin.json`
* Sources: `KpiCards.tsx:41-49`, `RevenueChart.tsx:28-32`, `RecentOrders.tsx:34-74`, `PeriodSelector.tsx:20-30`, `AsyncSection.tsx:33-59`, `src/app/api/admin/stats|revenue|orders/route.ts`

## Preconditions

* `dev.db` มี orders จาก seed (dashboard ไม่ว่างเปล่าในเคสหลัก)

## Cases

| ID | ชื่อ | Steps | Locators | Assert |
|---|---|---|---|---|
| D1 | `shows KPI revenue and orders when admin visits` | `goto('/admin')` | `dashboard/kpi-orders(-value)/kpi-revenue(-value)/revenue-card/recent-orders-card` | ทุก card visible + value ไม่ว่าง |
| D2 | `filters by period when selector changed` | กด `period-7d` → `period-30d` | `period-selector/period-7d/30d/revenue-total` | `revenue-total` เปลี่ยน (หรือ chart rerender) |
| D3 | `shows recent orders with totals` | ดูตาราง | `recent-order-row/date/total` | row > 0 + total มีค่า (เช่น `32900.00`) |
| D4 | `shows empty state when no orders` | `page.route('**/api/admin/orders**', [])` → reload | `recent-orders-empty` | empty visible แทน table |
| D5 | `retries when section fails` | `page.route('**/api/admin/stats**', 500)` → reload → กด retry | `*-error/*-retry` (`AsyncSection.tsx:33-41`) | หลัง retry (restore route) เห็น `dashboard` |
| D6 | `denies dashboard data when user role` | `user.json` → `goto('/admin')` | — | โดนดีด `/` ไม่เห็น `revenue-card` |

## Isolation

* D4/D5 mock network ระดับ test (`page.route`) — restore หลังจบ ไม่กระทบ D1-D3
* ห้าม assert ตัวเลข KPI ตายตัว (seed เปลี่ยนได้) assert แค่ visible + format

## Out of scope

* สูตร `avg=0 เมื่อ orderCount=0`, `revenueSum null→0`, day-key enum — `stats/revenue` unit (`test-cases/dashboard-reporting.md`)

## Traceability

* `test-cases/dashboard-reporting.md` + `order-management.md` (read-only), Risk #8/#3
