import { describe, expect, it } from "vitest"
import {
  parseAdminProductQuery,
  parseOrdersLimit,
  parseRouteId,
} from "@/lib/admin/admin-params"

const paramsOf = (query: string) => new URLSearchParams(query)

describe("parseOrdersLimit", () => {
  it("should return the default limit when missing", () => {
    // Arrange
    const params = paramsOf("")

    // Act
    const result = parseOrdersLimit(params)

    // Assert
    expect(result).toBe(5)
  })

  it.each([
    { raw: "1", expected: 1 },
    { raw: "2", expected: 2 },
    { raw: "49", expected: 49 },
    { raw: "50", expected: 50 },
  ])("should accept limit $raw", ({ raw, expected }) => {
    // Arrange
    const params = paramsOf(`limit=${raw}`)

    // Act
    const result = parseOrdersLimit(params)

    // Assert
    expect(result).toBe(expected)
  })

  it.each([{ raw: "51" }, { raw: "999" }])(
    "should clamp limit $raw to the maximum of 50",
    ({ raw }) => {
      // Arrange
      const params = paramsOf(`limit=${raw}`)

      // Act
      const result = parseOrdersLimit(params)

      // Assert
      expect(result).toBe(50)
    },
  )

  it.each([{ raw: "0" }, { raw: "-5" }, { raw: "abc" }])(
    "should fall back to default for limit $raw",
    ({ raw }) => {
      // Arrange
      const params = paramsOf(`limit=${raw}`)

      // Act
      const result = parseOrdersLimit(params)

      // Assert
      expect(result).toBe(5)
    },
  )
})

describe("parseRouteId", () => {
  it("should return the id for a positive integer", () => {
    // Arrange
    const value = "10"

    // Act
    const result = parseRouteId(value)

    // Assert
    expect(result).toBe(10)
  })

  it.each([{ value: "0" }, { value: "-3" }, { value: "abc" }])(
    "should return null for route id $value",
    ({ value }) => {
      // Arrange
      const input = value

      // Act
      const result = parseRouteId(input)

      // Assert
      expect(result).toBeNull()
    },
  )

  it("should return null when the value is missing", () => {
    // Arrange
    const value = undefined

    // Act
    const result = parseRouteId(value)

    // Assert
    expect(result).toBeNull()
  })
})

describe("parseAdminProductQuery", () => {
  it("should trim the search text and keep the page", () => {
    // Arrange
    const params = paramsOf("search=%20%20mac%20%20&page=2")

    // Act
    const result = parseAdminProductQuery(params)

    // Assert
    expect(result).toEqual({ search: "mac", page: 2 })
  })

  it("should default to empty search and page 1", () => {
    // Arrange
    const params = paramsOf("")

    // Act
    const result = parseAdminProductQuery(params)

    // Assert
    expect(result).toEqual({ search: "", page: 1 })
  })

  it("should fall back to page 1 for invalid page values", () => {
    // Arrange
    const params = paramsOf("page=abc")

    // Act
    const result = parseAdminProductQuery(params)

    // Assert
    expect(result.page).toBe(1)
  })
})
