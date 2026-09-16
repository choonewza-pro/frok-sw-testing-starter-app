import { describe, it, expect } from 'vitest'

function sum(a: number, b: number): number {
  return a + b
}


describe('บวกเลขสองจำนวน', () => {
  it('1 + 2 = 3', () => {
     // 1. Arrange: จัดเตรียมข้อมูลและสภาพแวดล้อมสำหรับการทดสอบ
    const a = 1
    const b = 2
    
    // 2. Act: เรียกใช้ฟังก์ชันหรือเมธอดที่ต้องการทดสอบ
    const result = sum(a, b)

    // 3. Assert: ตรวจสอบผลลัพธ์ที่ได้ว่าตรงกับที่คาดหวังหรือไม่
    expect(result).toBe(3)
  })
})