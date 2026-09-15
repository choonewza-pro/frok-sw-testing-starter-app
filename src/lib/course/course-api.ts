import type { Course } from "@/types/course"
import { courseResponseSchema } from "./course-schema"

export const DEFAULT_COURSE_API_URL = "https://api.codingthailand.com/api/course"

/**
 * ปลายทางของ API หลักสูตร
 * ตั้ง COURSE_API_URL ใน .env เพื่อชี้ไปที่ mock server ตอนรัน e2e
 * จะได้ไม่ต้องพึ่งอินเทอร์เน็ตและผลลัพธ์ไม่แกว่งตามข้อมูลจริง
 */
export function resolveCourseApiUrl(env: NodeJS.ProcessEnv = process.env): string {
  return env.COURSE_API_URL?.trim() || DEFAULT_COURSE_API_URL
}

export class CourseApiError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = "CourseApiError"
  }
}

type FetchCoursesOptions = {
  /** ฉีด fetch เข้ามาได้ เพื่อให้เทสต์ใช้ตัวปลอมแทนการยิงเน็ตจริง */
  fetchImpl?: typeof fetch
  url?: string
  timeoutMs?: number
}

/**
 * ดึงรายการหลักสูตรจาก API ภายนอก
 * รับผิดชอบ 3 อย่าง: ยิง request, เช็คสถานะ, validate รูปร่างข้อมูล
 * ถ้าอย่างใดอย่างหนึ่งพลาด จะโยน CourseApiError ที่มีข้อความชัดเจน
 */
export async function fetchCourses({
  fetchImpl = fetch,
  url = resolveCourseApiUrl(),
  timeoutMs = 10_000,
}: FetchCoursesOptions = {}): Promise<Course[]> {
  let response: Response
  try {
    response = await fetchImpl(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    throw new CourseApiError("เชื่อมต่อ API หลักสูตรไม่สำเร็จ", error)
  }

  if (!response.ok) {
    throw new CourseApiError(
      `API หลักสูตรตอบกลับผิดพลาด: ${response.status} ${response.statusText}`
    )
  }

  let json: unknown
  try {
    json = await response.json()
  } catch (error) {
    throw new CourseApiError("API หลักสูตรตอบกลับไม่ใช่ JSON", error)
  }

  const parsed = courseResponseSchema.safeParse(json)
  if (!parsed.success) {
    throw new CourseApiError("รูปแบบข้อมูลหลักสูตรไม่ตรงกับที่คาดไว้", parsed.error)
  }

  return parsed.data.data
}
