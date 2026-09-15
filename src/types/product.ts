/** แถวดิบจาก Prisma (products join product_images) — ฟิลด์ nullable ตาม schema */
export type ProductRow = {
  id: number
  name: string | null
  description: string | null
  price: number | null
  category_id: number | null
  product_images: { image_name: string }[]
}

/** รูปแบบที่ Client Component ใช้จริง — normalize แล้ว ไม่มี null */
export type ProductViewModel = {
  id: number
  name: string
  description: string
  price: number
  /** ชื่อไฟล์รูป เมื่อมีไฟล์อยู่จริงใน public/product-image เท่านั้น */
  picture: string | null
}

export type ProductListResult = {
  products: ProductViewModel[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  q: string
}
