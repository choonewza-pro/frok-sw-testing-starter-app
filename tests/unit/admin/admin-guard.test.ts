import { beforeEach, describe, expect, it, vi } from "vitest"
import { isAdmin } from "@/lib/admin/admin-guard"
import { requireAdmin } from "@/lib/admin/require-admin"

const { mockGetSession, mockRedirect } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockRedirect: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}))

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}))

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockRedirect.mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`)
  })
})

describe("isAdmin", () => {
  it("should return true for the admin role", () => {
    // Arrange
    const session = { user: { id: "1", role: "admin" } }

    // Act
    const result = isAdmin(session)

    // Assert
    expect(result).toBe(true)
  })

  it.each([
    { role: "user", reason: "normal user" },
    { role: "ADMIN", reason: "wrong case" },
    { role: "superadmin", reason: "unknown role" },
    { role: "", reason: "empty role" },
  ])("should return false for $reason", ({ role }) => {
    // Arrange
    const session = { user: { id: "1", role } }

    // Act
    const result = isAdmin(session)

    // Assert
    expect(result).toBe(false)
  })

  it.each([null, undefined])(
    "should return false when session is %s",
    (session) => {
      // Arrange
      const input = session as null | undefined

      // Act
      const result = isAdmin(input)

      // Assert
      expect(result).toBe(false)
    },
  )

  it("should return false when role is missing", () => {
    // Arrange
    const session = { user: { id: "1", role: null } }

    // Act
    const result = isAdmin(session)

    // Assert
    expect(result).toBe(false)
  })
})

describe("requireAdmin", () => {
  it("should return the session for an admin user", async () => {
    // Arrange
    const session = { user: { id: "1", role: "admin" } }
    mockGetSession.mockResolvedValue(session)

    // Act
    const result = await requireAdmin()

    // Assert
    expect(result).toBe(session)
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it("should redirect to login when there is no session", async () => {
    // Arrange
    mockGetSession.mockResolvedValue(null)

    // Act & Assert
    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT /login")
    expect(mockRedirect).toHaveBeenCalledWith("/login")
  })

  it("should redirect home when a non-admin visits an admin page", async () => {
    // Arrange
    mockGetSession.mockResolvedValue({ user: { id: "2", role: "user" } })

    // Act & Assert
    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT /")
    expect(mockRedirect).toHaveBeenCalledWith("/")
  })
})
