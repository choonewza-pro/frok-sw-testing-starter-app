import { create, type StoreApi, type UseBoundStore } from "zustand"
import { persist, createJSONStorage, type PersistStorage } from "zustand/middleware"
import type { CartItem } from "@/types/cart"
import * as cart from "./cart-logic"

export const CART_STORAGE_KEY = "skill-cart"

export type CartStore = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: number) => void
  updateQty: (productId: number, qty: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

type CreateCartStoreOptions = {
  /** state เริ่มต้น — ใช้ตั้งค่าเริ่มต้นในเทสต์ */
  initialItems?: CartItem[]
  /**
   * ที่เก็บข้อมูลถาวร ส่ง null เพื่อปิด persist
   * (เทสต์ควรส่ง null เพื่อไม่ให้ state รั่วข้ามเคส)
   */
  storage?: PersistStorage<Pick<CartStore, "items">> | null
  /** key ที่ใช้เก็บ แยก key ได้เวลาสร้างหลาย store */
  name?: string
}

/**
 * สร้าง store ใหม่หนึ่งตัว — แต่ละครั้งที่เรียกจะได้ state แยกกันอย่างสมบูรณ์
 * ใช้ใน test เพื่อไม่ต้อง reset singleton หรือล้าง localStorage ระหว่างเคส
 */
export function createCartStore(
  options: CreateCartStoreOptions = {}
): UseBoundStore<StoreApi<CartStore>> {
  const {
    initialItems = [],
    storage = createJSONStorage<Pick<CartStore, "items">>(() => localStorage),
    name = CART_STORAGE_KEY,
  } = options

  const initializer = (
    set: (partial: Partial<CartStore>) => void,
    get: () => CartStore
  ): CartStore => ({
    items: initialItems,
    addItem: (item) => set({ items: cart.addItem(get().items, item) }),
    removeItem: (productId) =>
      set({ items: cart.removeItem(get().items, productId) }),
    updateQty: (productId, qty) =>
      set({ items: cart.updateQty(get().items, productId, qty) }),
    clearCart: () => set({ items: [] }),
    totalItems: () => cart.totalItems(get().items),
    totalPrice: () => cart.totalPrice(get().items),
  })

  if (storage === null) {
    return create<CartStore>()(initializer)
  }

  return create<CartStore>()(
    persist(initializer, {
      name,
      storage,
      partialize: (state) => ({ items: state.items }),
    })
  )
}

/** store ที่แอปใช้จริง — persist ลง localStorage key `skill-cart` */
export const useCartStore = createCartStore()
