# Arrange–Act–Assert Pattern

The foundational structure for every unit test.

---

## Structure

Every test should have exactly **three phases**, visually separated:

```typescript
it('should apply 20% discount for VIP users', () => {
  // Arrange — prepare input, mocks, preconditions
  const price = 1000
  const userRole = 'vip'
  const couponCode = null

  // Act — call the function under test (ONE call only)
  const result = calculateDiscount(price, userRole, couponCode)

  // Assert — verify the result or side effect
  expect(result.finalPrice).toBe(800)
  expect(result.discountApplied).toBe(true)
})
```

---

## Rules

### Arrange

- Set up **all** inputs, mocks, and preconditions needed for the test
- If using mocks, configure their return values here
- Use factory functions or builders for complex objects — avoid inline object literals
  that repeat across tests

```typescript
// ✅ Good — factory function
const createUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  name: 'Test User',
  role: 'member',
  ...overrides,
})

// Arrange
const user = createUser({ role: 'vip' })
```

```typescript
// ❌ Bad — duplicate inline objects across tests
const user = { id: 'user-1', name: 'Test User', role: 'vip', email: 'test@test.com', ... }
```

### Act

- **One function call only** — the single action being tested
- If you find yourself calling two functions, you're testing two behaviors → split into two tests
- Store the result in a clearly named variable

```typescript
// ✅ Good — single action
const result = calculateDiscount(price, userRole, couponCode)

// ❌ Bad — multiple actions
const discount = getDiscount(userRole)
const result = applyDiscount(price, discount) // This is TWO acts
```

### Assert

- Assert on **behavior and contract**, not internal implementation
- Multiple `expect()` calls are OK **if they assert the same behavior**
- Keep assertions minimal — assert what this specific test is about

```typescript
// ✅ Good — asserting the same behavior (discount result)
expect(result.finalPrice).toBe(800)
expect(result.discountApplied).toBe(true)

// ❌ Bad — asserting implementation detail
expect(mockLogger.log).toHaveBeenCalledWith('discount applied') // testing internal logging
```

---

## Async Tests

For async functions, use `async/await` — never use `.then()` chains in tests:

```typescript
it('should return user profile when user exists', async () => {
  // Arrange
  mockUserRepository.findById.mockResolvedValue(createUser({ id: 'user-1' }))

  // Act
  const result = await getUserProfile('user-1')

  // Assert
  expect(result.id).toBe('user-1')
  expect(result.name).toBe('Test User')
})
```

For errors in async functions:

```typescript
it('should throw NotFoundError when user does not exist', async () => {
  // Arrange
  mockUserRepository.findById.mockResolvedValue(null)

  // Act & Assert (exception case — combined is acceptable)
  await expect(getUserProfile('nonexistent')).rejects.toThrow(NotFoundError)
})
```

---

## When Act & Assert Can Merge

The only acceptable case to merge Act and Assert is when **testing that an exception is thrown**:

```typescript
// ✅ Acceptable — testing thrown error
expect(() => calculateDiscount(-100, 'vip', null)).toThrow(InvalidPriceError)

// ✅ Acceptable — async error
await expect(fetchUser('bad-id')).rejects.toThrow(NotFoundError)
```

In all other cases, keep Act and Assert as separate phases.
