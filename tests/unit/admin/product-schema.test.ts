import { describe, expect, it } from "vitest"
import { parseNumberInput, productSchema } from "@/lib/admin/product-schema"

const validProduct = {
  name: "MacBook Air M3",
  description: "ชิป M3 แรม 8GB",
  price: 42900,
  categoryId: 2,
}

describe("productSchema", () => {
  it("should accept a fully valid product", () => {
    // Arrange
    const input = validProduct

    // Act
    const result = productSchema.safeParse(input)

    // Assert
    expect(result.success).toBe(true)
  })

  it("should accept a product without description", () => {
    // Arrange
    const input = { ...validProduct, description: "" }

    // Act
    const result = productSchema.safeParse(input)

    // Assert
    expect(result.success).toBe(true)
  })

  it.each([
    { price: 1, valid: true, reason: "minimum boundary" },
    { price: 2, valid: true, reason: "just above minimum" },
    { price: 9999999, valid: true, reason: "just below maximum" },
    { price: 10000000, valid: true, reason: "maximum boundary" },
    { price: 0, valid: false, reason: "zero is not positive" },
    { price: -100, valid: false, reason: "negative price" },
    { price: 10000001, valid: false, reason: "above maximum" },
  ])("should handle price $reason", ({ price, valid }) => {
    // Arrange
    const input = { ...validProduct, price }

    // Act
    const result = productSchema.safeParse(input)

    // Assert
    expect(result.success).toBe(valid)
  })

  it.each([
    { field: "name", value: "", reason: "required but empty" },
    { field: "name", value: "ก".repeat(256), reason: "longer than 255" },
    {
      field: "description",
      value: "ก".repeat(2001),
      reason: "longer than 2000",
    },
    { field: "categoryId", value: 0, reason: "nothing selected" },
    { field: "categoryId", value: -1, reason: "negative id" },
    { field: "categoryId", value: 1.5, reason: "not an integer" },
  ])(
    "should reject $field $reason",
    ({ field, value }: { field: string; value: unknown }) => {
      // Arrange
      const input = { ...validProduct, [field]: value }

      // Act
      const result = productSchema.safeParse(input)

      // Assert
      expect(result.success).toBe(false)
    },
  )
})

describe("parseNumberInput", () => {
  it.each([
    { raw: "1,000", expected: 1000, reason: "thousands separator" },
    { raw: " 4,290 ", expected: 4290, reason: "surrounding spaces" },
    { raw: "42900", expected: 42900, reason: "plain digits" },
    { raw: "19.99", expected: 19.99, reason: "decimal" },
  ])("should parse $raw ($reason)", ({ raw, expected }) => {
    // Arrange
    const input = raw

    // Act
    const result = parseNumberInput(input)

    // Assert
    expect(result).toBe(expected)
  })

  it.each([
    { raw: "", reason: "empty string" },
    { raw: "   ", reason: "spaces only" },
    { raw: "abc", reason: "non-numeric" },
    { raw: null, reason: "null" },
    { raw: undefined, reason: "missing value" },
  ])("should return null for $reason", ({ raw }) => {
    // Arrange
    const input = raw as string | null | undefined

    // Act
    const result = parseNumberInput(input)

    // Assert
    expect(result).toBeNull()
  })

  it("should return finite numbers as-is and reject NaN", () => {
    // Arrange & Act & Assert
    expect(parseNumberInput(5)).toBe(5)
    expect(parseNumberInput(Number.NaN)).toBeNull()
  })
})
