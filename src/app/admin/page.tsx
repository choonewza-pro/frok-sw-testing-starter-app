import { requireAdmin } from "@/lib/admin/require-admin";
import DashboardClient from "./components/DashboardClient";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// http://localhost:3000/admin
export default async function AdminDashboardPage() {
  // หน้านี้มีหน้าที่เดียวคือตรวจสิทธิ์ ข้อมูลทั้งหมด DashboardClient ไปดึงเองผ่าน Route Handlers
  await requireAdmin();

  return (
    <>
      <h1 className="mb-6 font-medium text-3xl tracking-[-0.02em]">ภาพรวมร้าน</h1>
      <DashboardClient />
    </>
  );
}
