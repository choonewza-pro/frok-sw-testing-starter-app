"use client"

import RecentOrders from "./RecentOrders"
import RevenueChart from "./RevenueChart"
import StatsSection from "./StatsSection"

/**
 * ทั้งหน้า Dashboard เป็น Client Component และดึงข้อมูลเองผ่าน Route Handlers
 * page.tsx มีหน้าที่แค่ตรวจสิทธิ์แล้ว render ตัวนี้
 *
 * แต่ละ section ดึงข้อมูลของตัวเองแยกกัน ทำให้ส่วนที่ช้าไม่บล็อกส่วนอื่น
 * และ error ของ section หนึ่งไม่ทำให้ทั้งหน้าพัง
 */
export default function DashboardClient() {
  return (
    <div className="flex flex-col gap-6" data-testid="dashboard">
      <StatsSection />
      <RevenueChart />
      <RecentOrders />
    </div>
  )
}
