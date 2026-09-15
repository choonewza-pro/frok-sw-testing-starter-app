import { describe, expect, it } from 'vitest'
import { contactSchema } from '@/lib/contact-schema'

const valid = {
  name: 'สมชาย ใจดี',
  email: 'test@example.com',
  subject: 'สอบถามสินค้า',
  message: 'ข้อความทดสอบสำหรับติดต่อร้าน',
}

describe('contact schema', () => {
  it('accepts valid input', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true)
  })

  it('trims whitespace', () => {
    const result = contactSchema.safeParse({
      ...valid,
      name: '  สมชาย ใจดี  ',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.name).toBe('สมชาย ใจดี')
  })

  it('rejects invalid email', () => {
    const result = contactSchema.safeParse({ ...valid, email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('rejects too-short and too-long fields', () => {
    expect(contactSchema.safeParse({ ...valid, name: 'ก' }).success).toBe(false)
    expect(contactSchema.safeParse({ ...valid, subject: 'ab' }).success).toBe(false)
    expect(
      contactSchema.safeParse({ ...valid, message: 'ข้อความ' }).success
    ).toBe(false)
    expect(
      contactSchema.safeParse({ ...valid, name: 'ก'.repeat(101) }).success
    ).toBe(false)
    expect(
      contactSchema.safeParse({ ...valid, subject: 'ก'.repeat(151) }).success
    ).toBe(false)
    expect(
      contactSchema.safeParse({ ...valid, message: 'ก'.repeat(2001) }).success
    ).toBe(false)
  })
})
