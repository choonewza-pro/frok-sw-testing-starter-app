import type { Period } from "@/lib/admin/period"
import type { RevenuePoint } from "@/lib/admin/revenue"
import type { DashboardStats } from "@/lib/admin/stats"

/** GET /api/admin/stats */
export type StatsResponse = DashboardStats

/** GET /api/admin/revenue?period=30d */
export type RevenueResponse = {
  period: Period
  points: RevenuePoint[]
  total: number
}

export type RecentOrder = {
  id: number
  /** ISO string — ฝั่ง Client เป็นคนจัดรูปแบบตาม locale */
  date: string | null
  customerName: string
  status: string
  totalAmount: number
}

/** GET /api/admin/orders?limit=5 */
export type OrdersResponse = {
  orders: RecentOrder[]
}

export type AdminProduct = {
  id: number
  name: string
  description: string
  price: number
  categoryId: number | null
  categoryName: string | null
}

/** GET /api/admin/products?search=&page=1 */
export type AdminProductsResponse = {
  products: AdminProduct[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type AdminCategory = {
  id: number
  name: string
}

/** GET /api/admin/categories */
export type CategoriesResponse = {
  categories: AdminCategory[]
}

/** รูปแบบ error ที่ทุก Route Handler ใช้ร่วมกัน */
export type ApiErrorResponse = {
  error: string
  fieldErrors?: Record<string, string[]>
}
