"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { requestJson, toErrorMessage } from "./api-client"

export type ResourceState<T> = {
  data: T | null
  isLoading: boolean
  error: string | null
  reload: () => void
}

type Options = {
  /** รีเฟรชอัตโนมัติทุกกี่มิลลิวินาที ไม่ใส่ = ไม่รีเฟรช */
  refreshMs?: number
}

type InternalState<T> = {
  url: string
  data: T | null
  isLoading: boolean
  error: string | null
}

/**
 * โหลดข้อมูลจาก URL พร้อมจัดการสถานะ loading / error / retry ให้ครบในที่เดียว
 *
 * - ยกเลิก request เดิมเมื่อ url เปลี่ยนหรือ component ถูกถอด กัน state เก่าทับของใหม่
 * - ตอนรีเฟรชอัตโนมัติจะไม่ตั้ง isLoading เพื่อไม่ให้หน้าจอกะพริบทุก 30 วินาที
 * - รีเซ็ต state ตอนเรนเดอร์เมื่อ url เปลี่ยน (แพตเทิร์น "adjusting state on prop change"
 *   ของ React) แทนการ setState ใน effect ซึ่งทำให้เกิดการเรนเดอร์ซ้อน
 */
export function useAdminResource<T>(url: string, { refreshMs }: Options = {}): ResourceState<T> {
  const [state, setState] = useState<InternalState<T>>({
    url,
    data: null,
    isLoading: true,
    error: null,
  })
  const controllerRef = useRef<AbortController | null>(null)

  if (state.url !== url) {
    setState({ url, data: null, isLoading: true, error: null })
  }

  const load = useCallback(
    async (signal: AbortSignal) => {
      try {
        const result = await requestJson<T>(url, { signal })
        if (signal.aborted) return
        setState({ url, data: result, isLoading: false, error: null })
      } catch (err) {
        if (signal.aborted) return
        if (err instanceof DOMException && err.name === "AbortError") return
        setState((prev) => ({ ...prev, isLoading: false, error: toErrorMessage(err) }))
      }
    },
    [url]
  )

  const start = useCallback(() => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    void load(controller.signal)
  }, [load])

  useEffect(() => {
    start()
    return () => controllerRef.current?.abort()
  }, [start])

  useEffect(() => {
    if (!refreshMs) return
    const timer = setInterval(start, refreshMs)
    return () => clearInterval(timer)
  }, [start, refreshMs])

  // ปุ่ม "ลองใหม่" เป็น event handler ไม่ใช่ effect จึงตั้ง isLoading ตรงนี้ได้
  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    start()
  }, [start])

  return { data: state.data, isLoading: state.isLoading, error: state.error, reload }
}
