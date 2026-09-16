import { afterEach, describe, expect, it, vi } from "vitest"
import {
  CourseApiError,
  DEFAULT_COURSE_API_URL,
  fetchCourses,
  resolveCourseApiUrl,
} from "@/lib/course/course-api"

const courseItem = {
  id: 1,
  title: "React Basic",
  detail: "พื้นฐาน React",
  date: "2026-01-01",
  view: 100,
  picture: "https://example.com/pic.png",
}

const okResponse = (data: unknown) =>
  ({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => data,
  }) as Response

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("resolveCourseApiUrl", () => {
  it("should return the default URL when env is not set", () => {
    // Arrange
    vi.stubEnv("COURSE_API_URL", "")

    // Act
    const result = resolveCourseApiUrl({ ...process.env, COURSE_API_URL: "" })

    // Assert
    expect(result).toBe(DEFAULT_COURSE_API_URL)
  })

  it("should prefer the env URL and trim spaces", () => {
    // Arrange
    const env = {
      ...process.env,
      COURSE_API_URL: "  http://mock/courses  ",
    }

    // Act
    const result = resolveCourseApiUrl(env)

    // Assert
    expect(result).toBe("http://mock/courses")
  })
})

describe("fetchCourses", () => {
  it("should return the course list on success", async () => {
    // Arrange
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(okResponse({ data: [courseItem] }))

    // Act
    const result = await fetchCourses({
      fetchImpl: fetchImpl as typeof fetch,
      url: "http://mock/courses",
    })

    // Assert
    expect(result).toEqual([courseItem])
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://mock/courses",
      expect.objectContaining({ cache: "no-store" }),
    )
  })

  it("should return an empty list when there are no courses", async () => {
    // Arrange
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({ data: [] }))

    // Act
    const result = await fetchCourses({
      fetchImpl: fetchImpl as typeof fetch,
      url: "http://mock/courses",
    })

    // Assert
    expect(result).toEqual([])
  })

  it("should throw CourseApiError when the API responds with an error status", async () => {
    // Arrange
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    })

    // Act & Assert
    await expect(
      fetchCourses({ fetchImpl: fetchImpl as typeof fetch }),
    ).rejects.toThrow(CourseApiError)
  })

  it("should throw CourseApiError when the body is not valid JSON", async () => {
    // Arrange
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => {
        throw new Error("Unexpected token")
      },
    })

    // Act & Assert
    await expect(
      fetchCourses({ fetchImpl: fetchImpl as typeof fetch }),
    ).rejects.toThrow("API หลักสูตรตอบกลับไม่ใช่ JSON")
  })

  it("should throw CourseApiError when the payload shape is wrong", async () => {
    // Arrange
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(okResponse({ data: [{ id: "not-a-number" }] }))

    // Act & Assert
    await expect(
      fetchCourses({ fetchImpl: fetchImpl as typeof fetch }),
    ).rejects.toThrow("รูปแบบข้อมูลหลักสูตรไม่ตรงกับที่คาดไว้")
  })

  it("should throw CourseApiError when the network fails", async () => {
    // Arrange
    const fetchImpl = vi.fn().mockRejectedValue(new Error("fetch failed"))

    // Act & Assert
    await expect(
      fetchCourses({ fetchImpl: fetchImpl as typeof fetch }),
    ).rejects.toThrow("เชื่อมต่อ API หลักสูตรไม่สำเร็จ")
  })
})
