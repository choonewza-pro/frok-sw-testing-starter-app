import { describe, expect, it } from "vitest"
import {
  DEFAULT_PERIOD,
  parsePeriod,
  periodRange,
  periodToDays,
} from "@/lib/admin/period"
import { buildRevenueSeries, sumRevenue } from "@/lib/admin/revenue"
import { calcDashboardStats } from "@/lib/admin/stats"

describe("calcDashboardStats", () => {
  it("should return zeros instead of NaN when there are no orders", () => {
    // Arrange
    const input = {
      orderCount: 0,
      productCount: 0,
      customerCount: 0,
      revenueSum: null,
    }

    // Act
    const result = calcDashboardStats(input)

    // Assert
    expect(result).toEqual({
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
    })
  })

  it("should compute totals and average order value", () => {
    // Arrange
    const input = {
      orderCount: 4,
      productCount: 20,
      customerCount: 10,
      revenueSum: 5000,
    }

    // Act
    const result = calcDashboardStats(input)

    // Assert
    expect(result.totalRevenue).toBe(5000)
    expect(result.averageOrderValue).toBe(1250)
  })

  it("should treat null revenue as zero", () => {
    // Arrange
    const input = {
      orderCount: 3,
      productCount: 5,
      customerCount: 2,
      revenueSum: null,
    }

    // Act
    const result = calcDashboardStats(input)

    // Assert
    expect(result.totalRevenue).toBe(0)
    expect(result.averageOrderValue).toBe(0)
  })
})

describe("buildRevenueSeries", () => {
  const range = {
    from: new Date("2026-03-01T00:00:00+07:00"),
    to: new Date("2026-03-03T00:00:00+07:00"),
  }

  it("should sum same-day orders and fill missing days with zero", () => {
    // Arrange
    const orders = [
      { date: new Date("2026-03-01T10:00:00+07:00"), total_amount: 100 },
      { date: new Date("2026-03-01T15:00:00+07:00"), total_amount: 200 },
      { date: new Date("2026-03-03T09:00:00+07:00"), total_amount: 50 },
    ]

    // Act
    const result = buildRevenueSeries(orders, range)

    // Assert
    expect(result).toEqual([
      { date: "2026-03-01", revenue: 300 },
      { date: "2026-03-02", revenue: 0 },
      { date: "2026-03-03", revenue: 50 },
    ])
  })

  it("should skip orders without a date and count null amounts as zero", () => {
    // Arrange
    const orders = [
      { date: null, total_amount: 500 },
      { date: new Date("2026-03-02T10:00:00+07:00"), total_amount: null },
    ]

    // Act
    const result = buildRevenueSeries(orders, range)

    // Assert
    expect(result).toEqual([
      { date: "2026-03-01", revenue: 0 },
      { date: "2026-03-02", revenue: 0 },
      { date: "2026-03-03", revenue: 0 },
    ])
  })

  it("should sum the whole series revenue", () => {
    // Arrange
    const points = [
      { date: "2026-03-01", revenue: 300 },
      { date: "2026-03-02", revenue: 0 },
      { date: "2026-03-03", revenue: 50 },
    ]

    // Act
    const result = sumRevenue(points)

    // Assert
    expect(result).toBe(350)
  })
})

describe("period", () => {
  it.each([
    { value: "7d", days: 7 },
    { value: "30d", days: 30 },
    { value: "90d", days: 90 },
  ])("should map period $value to $days days", ({ value, days }) => {
    // Arrange
    const period = parsePeriod(value)

    // Act
    const result = periodToDays(period)

    // Assert
    expect(result).toBe(days)
  })

  it.each([{ value: "14d" }, { value: "abc" }, { value: null }])(
    "should default to 30d for period $value",
    ({ value }) => {
      // Arrange
      const input = value as string | null

      // Act
      const result = parsePeriod(input)

      // Assert
      expect(result).toBe(DEFAULT_PERIOD)
    },
  )

  it("should cover 7 calendar days including today for the 7d period", () => {
    // Arrange
    const now = new Date(2026, 2, 10, 15, 30, 0)

    // Act
    const { from, to } = periodRange("7d", now)

    // Assert
    expect(to).toEqual(now)
    expect([from.getFullYear(), from.getMonth(), from.getDate()]).toEqual([
      2026, 2, 4,
    ])
    expect([from.getHours(), from.getMinutes()]).toEqual([0, 0])
  })
})
