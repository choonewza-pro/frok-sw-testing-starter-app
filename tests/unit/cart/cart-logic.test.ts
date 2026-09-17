import { describe, expect, it } from "vitest"
import {
  addItem,
  lineTotal,
  removeItem,
  totalItems,
  totalPrice,
  updateQty,
} from "@/lib/cart/cart-logic"
import { createCartStore } from "@/lib/cart/cart-store"
import type { CartItem } from "@/types/cart"

const createItem = (overrides?: Partial<CartItem>): CartItem => ({
  productId: 1,
  name: "iPhone 16 Pro",
  price: 100,
  qty: 1,
  ...overrides,
})

// BVA ของ lineTotal = price * qty (vary ทีละตัว อีกตัว fix เป็น nominal)
// C1-qty: valid >= 1 (ดู addItem/updateQty ที่กัน qty <= 0) -> ขอบล่างคือ 0|1 : เทส 0, 1, 2
// C2-price: valid > 0 ตาม productSchema.positive (0 กับติดลบคือ invalid) -> ขอบล่างคือ 0|1 : เทส -1, 0, 1
// เคสติดลบด้านล่างคือ robust BVA: จงใจส่ง invalid เข้าไป
// spec ที่ถูกคือปัดเป็น 0 (lineTotal มี guard กัน qty/price <= 0 แล้ว)
describe("lineTotal", () => {
  it.for([
    { qty: 0, price: 100, expected: 0 }, // Q min-1 (invalid)
    { qty: 1, price: 100, expected: 100 }, // Q min (valid)
    { qty: 2, price: 100, expected: 200 }, // Q min+1 (valid)
    { qty: 1, price: 0, expected: 0 }, // P min (invalid, ของฟรีไม่มีใน spec จริง)
    { qty: 1, price: 1, expected: 1 }, // P min+1 (valid เล็กสุด)
    { qty: -1, price: 100, expected: 0 }, // robust: qty ติดลบ
    { qty: 1, price: -1, expected: 0 }, // robust: price ติดลบ
  ])("คำนวณ $qty x $price = $expected", ({ qty, price, expected }) => {
    const product = createItem({ qty, price })
    expect(lineTotal(product)).toBe(expected)
  })
})

describe("addItem", () => {
  it("should add a new item to an empty cart", () => {
    // Arrange
    const item = createItem({ productId: 1, qty: 2 })

    // Act
    const result = addItem([], item)

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(item)
  })

  it.each([0, -1])("should ignore a new item when qty is %d", (qty) => {
    // Arrange
    const items = [createItem({ productId: 1, qty: 2 })]

    // Act
    const result = addItem(items, createItem({ productId: 2, qty }))

    // Assert
    expect(result).toEqual(items)
  })

  it("should sum qty when adding an existing product", () => {
    // Arrange
    const items = [createItem({ productId: 1, qty: 2 })]

    // Act
    const result = addItem(items, createItem({ productId: 1, qty: 3 }))

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0].qty).toBe(5)
  })

  it("should not mutate the original items array", () => {
    // Arrange
    const items = [createItem({ productId: 1, qty: 2 })]

    // Act
    addItem(items, createItem({ productId: 1, qty: 3 }))

    // Assert
    expect(items[0].qty).toBe(2)
  })
})

describe("updateQty", () => {
  it("should set the new qty for an existing product", () => {
    // Arrange
    const items = [createItem({ productId: 1, qty: 2 })]

    // Act
    const result = updateQty(items, 1, 5)

    // Assert
    expect(result[0].qty).toBe(5)
  })

  it.each([0, -2])(
    "should remove the item when qty is updated to %d",
    (qty) => {
      // Arrange
      const items = [createItem({ productId: 1, qty: 2 })]

      // Act
      const result = updateQty(items, 1, qty)

      // Assert
      expect(result).toHaveLength(0)
    },
  )

  it("should leave the cart unchanged for an unknown productId", () => {
    // Arrange
    const items = [createItem({ productId: 1, qty: 2 })]

    // Act
    const result = updateQty(items, 99, 5)

    // Assert
    expect(result).toEqual(items)
  })
})

describe("removeItem", () => {
  it("should remove the item matching productId", () => {
    // Arrange
    const items = [
      createItem({ productId: 1 }),
      createItem({ productId: 2, name: "AirPods" }),
    ]

    // Act
    const result = removeItem(items, 1)

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0].productId).toBe(2)
  })

  it("should leave the cart unchanged for an unknown productId", () => {
    // Arrange
    const items = [createItem({ productId: 1 })]

    // Act
    const result = removeItem(items, 99)

    // Assert
    expect(result).toEqual(items)
  })
})

describe("totals", () => {
  it("should sum qty and price across all lines", () => {
    // Arrange
    const items = [
      createItem({ productId: 1, price: 100, qty: 2 }),
      createItem({ productId: 2, price: 250, qty: 1 }),
    ]

    // Act
    const itemsCount = totalItems(items)
    const price = totalPrice(items)

    // Assert
    expect(itemsCount).toBe(3)
    expect(price).toBe(450)
  })

  it("should return zero totals for an empty cart", () => {
    // Arrange
    const items: CartItem[] = []

    // Act
    const itemsCount = totalItems(items)
    const price = totalPrice(items)

    // Assert
    expect(itemsCount).toBe(0)
    expect(price).toBe(0)
  })

  it("should compute lineTotal as price times qty", () => {
    // Arrange
    const item = createItem({ price: 199, qty: 3 })

    // Act
    const result = lineTotal(item)

    // Assert
    expect(result).toBe(597)
  })
})

describe("createCartStore (without persistence)", () => {
  it("should add, update, and clear items through the store", () => {
    // Arrange
    const store = createCartStore({ storage: null })

    // Act
    store.getState().addItem(createItem({ productId: 7, price: 12900, qty: 2 }))
    store.getState().updateQty(7, 1)

    // Assert
    expect(store.getState().totalItems()).toBe(1)
    expect(store.getState().totalPrice()).toBe(12900)

    // Act
    store.getState().clearCart()

    // Assert
    expect(store.getState().items).toHaveLength(0)
  })

  it("should keep state independent between store instances", () => {
    // Arrange
    const first = createCartStore({ storage: null })
    const second = createCartStore({ storage: null })

    // Act
    first.getState().addItem(createItem({ productId: 1 }))

    // Assert
    expect(first.getState().items).toHaveLength(1)
    expect(second.getState().items).toHaveLength(0)
  })
})
