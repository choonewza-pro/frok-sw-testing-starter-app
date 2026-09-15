"use client"

import { useCartStore } from "@/lib/cart/cart-store";
import { useSyncExternalStore } from "react";

/**
 * store ถูก persist ลง localStorage ซึ่งฝั่ง server ไม่มี
 * useSyncExternalStore จึงคืนค่า snapshot ฝั่ง server เป็น 0 เสมอ
 * ทำให้ HTML ที่ render จาก server ตรงกับ client เสมอ ไม่เกิด hydration mismatch
 * (แทนรูปแบบเดิมที่ใช้ useState + useEffect แล้วซ่อน component ไว้ก่อน)
 */
export default function CountCartItem() {
  const totalItems = useSyncExternalStore(
    useCartStore.subscribe,
    () => useCartStore.getState().totalItems(),
    () => 0
  );

  return <span data-testid="cart-count">{totalItems}</span>;
}
