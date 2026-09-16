import { describe, expect, it } from "vitest"
import {
  calcSkip,
  calcTotalPages,
  parseProductSearchParams,
} from "@/lib/product/product-params"

describe("parseProductSearchParams", () => {
  it("should parse a normal search and page", () => {
    // Arrange
    const params = { q: "iPhone", page: "2" }

    // Act
    const result = parseProductSearchParams(params)

    // Assert
    expect(result).toEqual({ q: "iPhone", page: 2 })
  })

  it("should trim the search text", () => {
    // Arrange
    const params = { q: "  mac  " }

    // Act
    const result = parseProductSearchParams(params)

    // Assert
    expect(result.q).toBe("mac")
  })

  it.each([{ q: undefined }, { q: ["a", "b"] }])(
    "should default q to empty string",
    ({ q }) => {
      // Arrange
      const params = { q: q as string[] | undefined }

      // Act
      const result = parseProductSearchParams(params)

      // Assert
      expect(result.q).toBe("")
    },
  )

  it.each([{ page: undefined }, { page: "0" }, { page: "-3" }, { page: "abc" }])(
    "should fall back to page 1 for page=$page",
    ({ page }) => {
      // Arrange
      const params = { page: page as string | undefined }

      // Act
      const result = parseProductSearchParams(params)

      // Assert
      expect(result.page).toBe(1)
    },
  )

  it("should default to empty search on page 1 when params are missing", () => {
    // Arrange
    const params = {}

    // Act
    const result = parseProductSearchParams(params)

    // Assert
    expect(result).toEqual({ q: "", page: 1 })
  })
})

describe("calcTotalPages", () => {
  it.each([
    { total: 0, pageSize: 10, expected: 1, reason: "empty store still has 1 page" },
    { total: 20, pageSize: 10, expected: 2, reason: "exact full pages" },
    { total: 21, pageSize: 10, expected: 3, reason: "partial last page" },
    { total: 50, pageSize: 0, expected: 1, reason: "zero pageSize guard" },
  ])(
    "should return $expected pages ($reason)",
    ({ total, pageSize, expected }) => {
      // Arrange
      const input = { total, pageSize }

      // Act
      const result = calcTotalPages(input.total, input.pageSize)

      // Assert
      expect(result).toBe(expected)
    },
  )
})

describe("calcSkip", () => {
  it.each([
    { page: 1, pageSize: 10, expected: 0 },
    { page: 2, pageSize: 10, expected: 10 },
    { page: 0, pageSize: 10, expected: 0 },
  ])(
    "should skip $expected rows for page $page",
    ({ page, pageSize, expected }) => {
      // Arrange
      const input = { page, pageSize }

      // Act
      const result = calcSkip(input.page, input.pageSize)

      // Assert
      expect(result).toBe(expected)
    },
  )
})
