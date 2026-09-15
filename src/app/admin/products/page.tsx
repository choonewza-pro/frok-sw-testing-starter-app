import { requireAdmin } from "@/lib/admin/require-admin";
import ProductsClient from "../components/ProductsClient";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// http://localhost:3000/admin/products
export default async function AdminProductsPage() {
  // ตรวจสิทธิ์อย่างเดียว ข้อมูลสินค้าทั้งหมด ProductsClient ไปดึงเองผ่าน Route Handlers
  await requireAdmin();

  return (
    <>
      <h1 className="mb-6 font-medium text-3xl tracking-[-0.02em]">จัดการสินค้า</h1>
      <ProductsClient />
    </>
  );
}
