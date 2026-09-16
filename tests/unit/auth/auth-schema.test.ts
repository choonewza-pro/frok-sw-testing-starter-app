import { describe, expect, it } from "vitest"
import { loginSchema, registerSchema } from "@/lib/auth-schema"

const validLogin = { email: "nok.suda@gmail.com", password: "Suda1234" }
const validRegister = {
  name: "สุดา",
  email: "nok.suda@gmail.com",
  password: "Suda1234",
  confirmPassword: "Suda1234",
}

describe("loginSchema", () => {
  it("should accept a valid email and password", () => {
    // Arrange
    const input = validLogin

    // Act
    const result = loginSchema.safeParse(input)

    // Assert
    expect(result.success).toBe(true)
  })

  it("should accept a password of exactly 8 characters", () => {
    // Arrange
    const input = { ...validLogin, password: "12345678" }

    // Act
    const result = loginSchema.safeParse(input)

    // Assert
    expect(result.success).toBe(true)
  })

  it.each([
    { field: "email", value: "", reason: "required but empty" },
    { field: "email", value: "user-at-mail", reason: "invalid format" },
    { field: "email", value: "user@", reason: "missing domain" },
    { field: "password", value: "", reason: "required but empty" },
    { field: "password", value: "1234567", reason: "shorter than 8 chars" },
  ])(
    "should reject login $field $reason",
    ({ field, value }: { field: string; value: string }) => {
      // Arrange
      const input = { ...validLogin, [field]: value }

      // Act
      const result = loginSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(false)
    },
  )
})

describe("registerSchema", () => {
  it("should accept a fully valid registration", () => {
    // Arrange
    const input = validRegister

    // Act
    const result = registerSchema.safeParse(input)

    // Assert
    expect(result.success).toBe(true)
  })

  it.each([
    { name: "x".repeat(2), valid: true, reason: "minimum length" },
    { name: "สุดา แก้วใส", valid: true, reason: "normal Thai name" },
    { name: "ก".repeat(50), valid: true, reason: "maximum length" },
    { name: "", valid: false, reason: "required but empty" },
    { name: "ก", valid: false, reason: "shorter than 2 chars" },
    { name: "ก".repeat(51), valid: false, reason: "longer than 50 chars" },
  ])("should handle name with $reason", ({ name, valid }) => {
    // Arrange
    const input = { ...validRegister, name }

    // Act
    const result = registerSchema.safeParse(input)

    // Assert
    expect(result.success).toBe(valid)
  })

  it("should reject when confirmPassword does not match", () => {
    // Arrange
    const input = { ...validRegister, confirmPassword: "Suda2025" }

    // Act
    const result = registerSchema.safeParse(input)

    // Assert
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toBeDefined()
    }
  })

  it("should reject when confirmPassword is empty", () => {
    // Arrange
    const input = { ...validRegister, confirmPassword: "" }

    // Act
    const result = registerSchema.safeParse(input)

    // Assert
    expect(result.success).toBe(false)
  })
})
