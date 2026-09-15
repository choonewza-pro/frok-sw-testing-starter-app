import { beforeEach, describe, expect, it } from 'vitest'
import { useCartStore } from '@/lib/cart-store'

beforeEach(() => {
  localStorage.clear()
  useCartStore.setState({ items: [] })
})

describe('cart store', () => {
  it('adds a new item to the cart', () => {
    useCartStore
      .getState()
      .addItem({ productId: '1', name: 'Test', price: 100, qty: 1 })

    expect(useCartStore.getState().items).toHaveLength(1)
  })

  it('merges quantity when adding an existing item', () => {
    const { addItem } = useCartStore.getState()
    addItem({ productId: '1', name: 'Test', price: 100, qty: 1 })
    addItem({ productId: '1', name: 'Test', price: 100, qty: 2 })

    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].qty).toBe(3)
  })

  it('removes an item by productId', () => {
    const { addItem, removeItem } = useCartStore.getState()
    addItem({ productId: '1', name: 'Test', price: 100, qty: 1 })
    addItem({ productId: '2', name: 'Test 2', price: 50, qty: 2 })

    removeItem('1')

    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].productId).toBe('2')
  })

  it('computes totalItems and totalPrice', () => {
    const { addItem } = useCartStore.getState()
    addItem({ productId: '1', name: 'Test', price: 100, qty: 2 })
    addItem({ productId: '2', name: 'Test 2', price: 50, qty: 3 })

    expect(useCartStore.getState().totalItems()).toBe(5)
    expect(useCartStore.getState().totalPrice()).toBe(350)
  })

  it('clears the cart', () => {
    const { addItem, clearCart } = useCartStore.getState()
    addItem({ productId: '1', name: 'Test', price: 100, qty: 1 })

    clearCart()

    expect(useCartStore.getState().items).toHaveLength(0)
    expect(useCartStore.getState().totalItems()).toBe(0)
  })
})
