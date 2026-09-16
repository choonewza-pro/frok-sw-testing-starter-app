import type { PrismaClient } from "@generated/prisma/client"
import { describe, expect, it, vi } from "vitest"
import { fetchRecentOrders } from "@/lib/admin/admin-repository"

const stubPrisma = (rows: unknown[]) =>
  ({
    orders: { findMany: vi.fn().mockResolvedValue(rows) },
  }) as unknown as PrismaClient

describe("fetchRecentOrders", () => {
  it("should pass the limit and newest-first ordering to prisma", async () => {
    // Arrange
    const prisma = stubPrisma([])
    const findMany = vi.mocked(prisma.orders.findMany)

    // Act
    await fetchRecentOrders(prisma, 5)

    // Assert
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
        orderBy: [{ date: "desc" }, { id: "desc" }],
      }),
    )
  })

  it("should map a complete row to the recent order shape", async () => {
    // Arrange
    const prisma = stubPrisma([
      {
        id: 3,
        date: new Date("2026-03-10T10:00:00.000Z"),
        status: "paid",
        total_amount: 1290,
        customers: { name: "สมชาย" },
      },
    ])

    // Act
    const result = await fetchRecentOrders(prisma, 5)

    // Assert
    expect(result).toEqual([
      {
        id: 3,
        date: "2026-03-10T10:00:00.000Z",
        customerName: "สมชาย",
        status: "paid",
        totalAmount: 1290,
      },
    ])
  })

  it("should fall back for rows with missing data instead of crashing", async () => {
    // Arrange
    const prisma = stubPrisma([
      {
        id: 7,
        date: null,
        status: null,
        total_amount: null,
        customers: null,
      },
    ])

    // Act
    const result = await fetchRecentOrders(prisma, 5)

    // Assert
    expect(result).toEqual([
      {
        id: 7,
        date: null,
        customerName: "ไม่ระบุชื่อ",
        status: "unknown",
        totalAmount: 0,
      },
    ])
  })
})
