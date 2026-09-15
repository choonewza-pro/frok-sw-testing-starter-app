import type { ProductRow, ProductViewModel } from "@/types/product"

/**
 * ตัวตรวจว่าไฟล์รูปมีอยู่จริงหรือไม่ — แยกเป็น dependency ที่ฉีดเข้ามาได้
 * โค้ดจริงส่งตัวที่อ่าน filesystem เข้ามา ส่วนเทสต์ส่งฟังก์ชันปลอมเข้ามาแทน
 */
export type ImageExists = (imageName: string) => boolean

/**
 * แปลงแถวจากฐานข้อมูลให้เป็นข้อมูลที่ Client Component ใช้ได้
 * - ฟิลด์ nullable จาก schema ถูกแทนด้วยค่า default
 * - price แปลงเป็น number เสมอ (ส่ง Decimal ข้าม server/client boundary ไม่ได้)
 * - picture เป็น null ถ้าไม่มีรูป หรือมีชื่อรูปแต่ไฟล์หายไป
 */
export function toProductViewModel(
  row: ProductRow,
  imageExists: ImageExists
): ProductViewModel {
  const imageName = row.product_images[0]?.image_name ?? null

  return {
    id: row.id,
    name: row.name ?? "(ไม่มีชื่อสินค้า)",
    description: row.description ?? "",
    price: Number(row.price ?? 0),
    picture: imageName && imageExists(imageName) ? imageName : null,
  }
}

export function toProductViewModels(
  rows: ProductRow[],
  imageExists: ImageExists
): ProductViewModel[] {
  return rows.map((row) => toProductViewModel(row, imageExists))
}
