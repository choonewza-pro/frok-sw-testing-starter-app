import { describe, expect, it, vi } from "vitest"
import {
  deleteProductSafely,
  saveProduct,
} from "@/lib/admin/product-admin-service"
import type { AdminProduct } from "@/types/admin"

const validInput = {
  name: "MacBook Air M3",
  description: "",
  price: 42900,
  categoryId: 2,
}

const storedProduct: AdminProduct = {
  id: 10,
  name: "MacBook Air M3",
  description: "",
  price: 42900,
  categoryId: 2,
  categoryName: "Laptops",
}

describe("saveProduct", () => {
  it("should save and return the product when input is valid", async () => {
    // Arrange
    const save = vi.fn().mockResolvedValue(storedProduct)

    // Act
    const result = await saveProduct(validInput, { save })

    // Assert
    expect(result).toEqual({ ok: true, data: storedProduct })
    expect(save).toHaveBeenCalledWith(validInput)
  })

  it("should reject with 400 and skip saving when price is zero", async () => {
    // Arrange
    const save = vi.fn()
    const input = { ...validInput, price: 0 }

    // Act
    const result = await saveProduct(input, { save })

    // Assert
    expect(result).toMatchObject({ ok: false, status: 400 })
    expect(save).not.toHaveBeenCalled()
  })

  it("should include field errors when validation fails", async () => {
    // Arrange
    const save = vi.fn()
    const input = { ...validInput, name: "" }

    // Act
    const result = await saveProduct(input, { save })

    // Assert
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.fieldErrors?.name).toBeDefined()
    }
    expect(save).not.toHaveBeenCalled()
  })
})

describe("deleteProductSafely", () => {
  const deps = (overrides = {}) => ({
    findProductById: vi.fn().mockResolvedValue({ id: 10, name: "MacBook" }),
    countOrderItems: vi.fn().mockResolvedValue(0),
    deleteProduct: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  })

  it("should delete the product when it exists and has no order references", async () => {
    // Arrange
    const { findProductById, countOrderItems, deleteProduct } = deps()

    // Act
    const result = await deleteProductSafely(10, {
      findProductById,
      countOrderItems,
      deleteProduct,
    })

    // Assert
    expect(result).toEqual({ ok: true, data: { id: 10 } })
    expect(deleteProduct).toHaveBeenCalledWith(10)
  })

  it("should return 404 without deleting when the product does not exist", async () => {
    // Arrange
    const { findProductById, countOrderItems, deleteProduct } = deps({
      findProductById: vi.fn().mockResolvedValue(null),
    })

    // Act
    const result = await deleteProductSafely(9999, {
      findProductById,
      countOrderItems,
      deleteProduct,
    })

    // Assert
    expect(result).toMatchObject({ ok: false, status: 404 })
    expect(countOrderItems).not.toHaveBeenCalled()
    expect(deleteProduct).not.toHaveBeenCalled()
  })

  it("should return 409 without deleting when orders reference the product", async () => {
    // Arrange
    const { findProductById, countOrderItems, deleteProduct } = deps({
      countOrderItems: vi.fn().mockResolvedValue(3),
    })

    // Act
    const result = await deleteProductSafely(5, {
      findProductById,
      countOrderItems,
      deleteProduct,
    })

    // Assert
    expect(result).toMatchObject({ ok: false, status: 409 })
    expect(deleteProduct).not.toHaveBeenCalled()
  })
})
