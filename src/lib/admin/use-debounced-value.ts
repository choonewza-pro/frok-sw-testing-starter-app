"use client"

import { useEffect, useState } from "react"

/**
 * หน่วงค่าไว้ก่อนส่งต่อ ใช้กับช่องค้นหาเพื่อไม่ให้ยิง request ทุกตัวอักษรที่พิมพ์
 * setState อยู่ใน callback ของ setTimeout ไม่ใช่ใน effect body จึงไม่เกิดการเรนเดอร์ซ้อน
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
