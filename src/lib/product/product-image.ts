import { existsSync } from "node:fs"
import { join } from "node:path"
import type { ImageExists } from "./product-view-model"

export const PRODUCT_IMAGE_DIR = join(process.cwd(), "public", "product-image")

/**
 * ตัวตรวจไฟล์รูปของจริง (อ่าน filesystem) — ใช้เฉพาะฝั่ง server
 * ถูกแยกออกจาก view model เพื่อให้ส่วนที่แปลงข้อมูลยังเป็น pure function
 */
export const fileSystemImageExists: ImageExists = (imageName) =>
  existsSync(join(PRODUCT_IMAGE_DIR, imageName))
