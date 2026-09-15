import type { ApiErrorResponse } from "@/types/admin"

export const CLIENT_MESSAGES = {
  network: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่",
  unknown: "เกิดข้อผิดพลาดที่ไม่รู้จัก",
} as const

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message)
    this.name = "ApiError"
  }
}

type RequestOptions = {
  /** ฉีด fetch ปลอมเข้ามาได้ตอนเขียนเทสต์ */
  fetchImpl?: typeof fetch
  signal?: AbortSignal
  method?: string
  body?: unknown
}

/**
 * จุดเดียวที่ฝั่ง Client คุยกับ API
 *
 * รับผิดชอบ 3 อย่าง: ยิง request, แปลงสถานะที่ไม่ใช่ 2xx ให้เป็น ApiError
 * ที่มีข้อความภาษาไทยจาก body และ parse JSON
 * ทุกหน้าจึงได้ error รูปแบบเดียวกันไปแสดงผล
 */
export async function requestJson<T>(
  url: string,
  { fetchImpl = fetch, signal, method = "GET", body }: RequestOptions = {}
): Promise<T> {
  let response: Response
  try {
    response = await fetchImpl(url, {
      method,
      signal,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    })
  } catch (error) {
    // ผู้ใช้กดเปลี่ยนหน้าหรือเปลี่ยน period ระหว่างโหลด ไม่ใช่ error ที่ต้องแสดง
    if (error instanceof DOMException && error.name === "AbortError") throw error
    throw new ApiError(CLIENT_MESSAGES.network, 0)
  }

  if (!response.ok) {
    const parsed = await response.json().catch(() => null)
    const payload = parsed as ApiErrorResponse | null
    throw new ApiError(
      payload?.error ?? `${CLIENT_MESSAGES.unknown} (${response.status})`,
      response.status,
      payload?.fieldErrors
    )
  }

  if (response.status === 204) return undefined as T

  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError(CLIENT_MESSAGES.unknown, response.status)
  }
}

/** ดึงข้อความ error ที่แสดงให้ผู้ใช้ได้จาก error อะไรก็ตามที่โยนออกมา */
export function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return CLIENT_MESSAGES.unknown
}
