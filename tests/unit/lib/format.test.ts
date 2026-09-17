import { describe, expect, it } from "vitest"
import {
  THAI_LOCALE,
  formatCount,
  formatDateTimeTH,
  formatPrice,
  formatShortDateTH,
  formatTHB,
} from "@/lib/format"

// Necessary: กันคนแก้ locale หลุดแล้วพังทั้งไฟล์ (ทุก formatter ผูกกับค่านี้)
describe("THAI_LOCALE", () => {
  it("should use Thai locale", () => {
    // Arrange + Act + Assert (ค่าคงที่ ตรวจตรงๆ)
    expect(THAI_LOCALE).toBe("th-TH")
  })
})

describe("formatPrice", () => {
  // Happy path: ราคาปกติที่หน้าร้าน/ตะกร้าเจอจริง
  it.each([
    { value: 0, expected: "0.00" },
    { value: 100, expected: "100.00" },
    { value: 199.9, expected: "199.90" },
    { value: 12900, expected: "12900.00" },
  ])("Happy path: $value -> $expected", ({ value, expected }) => {
    // Arrange
    const input = value

    // Act
    const result = formatPrice(input)

    // Assert
    expect(result).toBe(expected)
  })

  // Happy path (บันทึกพฤติกรรม): format ไม่ได้ห้ามติดลบ หน้าที่กันยอดติดลบเป็นของ lineTotal
  it("Happy path: should keep negative sign (-50 -> -50.00)", () => {
    // Arrange
    const input = -50

    // Act
    const result = formatPrice(input)

    // Assert
    expect(result).toBe("-50.00")
  })

  // Negative path: input ที่ไม่ใช่จำนวนจริง ต้อง fallback เป็น "0.00" ไม่พ่น error
  it.each([{ value: NaN }, { value: Infinity }, { value: -Infinity }])(
    "Negative path: $value -> 0.00",
    ({ value }) => {
      // Arrange
      const input = value

      // Act
      const result = formatPrice(input)

      // Assert
      expect(result).toBe("0.00")
    },
  )

  // Edge case: การปัดทศนิยมของ toFixed(2) + ค่าขอบ
  it.each([
    { value: 0.005, expected: "0.01" }, // ปัดขึ้น
    { value: 0.004, expected: "0.00" }, // ปัดลง
    { value: 19.999, expected: "20.00" }, // ปัดข้ามหลัก
    { value: -0, expected: "0.00" }, // ลบศูนย์ต้องไม่โชว์ "-0.00"
    { value: 10_000_000, expected: "10000000.00" }, // max ตาม productSchema
  ])("Edge case: $value -> $expected", ({ value, expected }) => {
    // Arrange
    const input = value

    // Act
    const result = formatPrice(input)

    // Assert
    expect(result).toBe(expected)
  })
})

describe("formatTHB", () => {
  // Happy path: ยอดที่หน้า Admin เจอจริง (มี ฿ + คั่นหลักพัน)
  it.each([
    { value: 0, expected: "฿0.00" },
    { value: 100, expected: "฿100.00" },
    { value: 199.5, expected: "฿199.50" },
    { value: 12900, expected: "฿12,900.00" },
  ])("Happy path: $value -> $expected", ({ value, expected }) => {
    // Arrange
    const input = value

    // Act
    const result = formatTHB(input)

    // Assert
    expect(result).toBe(expected)
  })

  // Negative path: input ไม่ใช่จำนวนจริง ต้อง fallback เท่ากับ format(0)
  it.each([{ value: NaN }, { value: Infinity }, { value: -Infinity }])(
    "Negative path: $value -> ฿0.00",
    ({ value }) => {
      // Arrange
      const input = value

      // Act
      const result = formatTHB(input)

      // Assert
      expect(result).toBe("฿0.00")
    },
  )

  // Edge case: ยอดติดลบ + ปัดเศษ + ค่า max
  it.each([
    { value: -500, expected: "-฿500.00" }, // ติดลบยังโชว์เครื่องหมาย (ให้ชั้นบนเป็นคนกัน)
    { value: 199.999, expected: "฿200.00" }, // ปัดทศนิยมตำแหน่งที่ 2
    { value: 10_000_000, expected: "฿10,000,000.00" }, // max ตาม productSchema
  ])("Edge case: $value -> $expected", ({ value, expected }) => {
    // Arrange
    const input = value

    // Act
    const result = formatTHB(input)

    // Assert
    expect(result).toBe(expected)
  })
})

describe("formatCount", () => {
  // Happy path: จำนวนนับที่ KpiCards ใช้ (order/product/customer)
  it.each([
    { value: 0, expected: "0" },
    { value: 5, expected: "5" },
    { value: 1000, expected: "1,000" },
    { value: 1234567, expected: "1,234,567" },
  ])("Happy path: $value -> $expected", ({ value, expected }) => {
    // Arrange
    const input = value

    // Act
    const result = formatCount(input)

    // Assert
    expect(result).toBe(expected)
  })

  // Negative path: input ไม่ใช่จำนวนจริง ต้อง fallback เป็น "0"
  it.each([{ value: NaN }, { value: Infinity }, { value: -Infinity }])(
    "Negative path: $value -> 0",
    ({ value }) => {
      // Arrange
      const input = value

      // Act
      const result = formatCount(input)

      // Assert
      expect(result).toBe("0")
    },
  )

  // Edge case: ค่าติดลบ + ทศนิยมหลุดมา + ค่าใหญ่มาก
  it.each([
    { value: -3, expected: "-3" },
    { value: 4.5, expected: "4.5" }, // formatter ไม่ได้ปัดเป็น int ให้
    { value: Number.MAX_SAFE_INTEGER, expected: "9,007,199,254,740,991" },
  ])("Edge case: $value -> $expected", ({ value, expected }) => {
    // Arrange
    const input = value

    // Act
    const result = formatCount(input)

    // Assert
    expect(result).toBe(expected)
  })
})

describe("formatDateTimeTH", () => {
  // Happy path: Date ที่ถูกต้องต้องได้ string ไทย (มีวัน/เดือน/ปี พ.ศ.)
  it("Happy path: should format a valid Date in Thai", () => {
    // Arrange
    const input = new Date(2026, 8, 15, 10, 30) // 15 ก.ย. 2026 10:30 เวลา local

    // Act
    const result = formatDateTimeTH(input)

    // Assert
    expect(result).toContain("15")
    expect(result).toContain("ก.ย.")
    expect(result).toContain("2569") // พ.ศ. = ค.ศ. + 543
    expect(result).toContain("10:30")
  })

  // Happy path: ISO string ที่ถูกต้องต้องได้ผลเหมือน Date
  it("Happy path: should accept an ISO string", () => {
    // Arrange
    const input = "2026-09-15T10:30:00+07:00"

    // Act
    const result = formatDateTimeTH(input)

    // Assert
    expect(result).not.toBe("-")
    expect(result).toContain("ก.ย.")
    expect(result).toContain("2569")
  })

  // Negative path: ค่าว่าง/ค่าไม่ใช่วันที่ ต้องคืน "-" ไม่พ่น error
  it.each([{ value: null }, { value: undefined }, { value: "" }])(
    "Negative path: $value -> -",
    ({ value }) => {
      // Arrange
      const input = value

      // Act
      const result = formatDateTimeTH(input)

      // Assert
      expect(result).toBe("-")
    },
  )

  // Negative path: string/Date ที่ parse ไม่ได้ ต้องคืน "-"
  it.each([{ value: "not-a-date" }, { value: new Date(NaN) }])(
    "Negative path: invalid date -> -",
    ({ value }) => {
      // Arrange
      const input = value

      // Act
      const result = formatDateTimeTH(input)

      // Assert
      expect(result).toBe("-")
    },
  )

  // Necessary: Date กับ ISO string ของ instant เดียวกันต้องได้ผลเท่ากัน (กัน bug timezone/parse)
  it("Necessary: Date and ISO string of the same instant should match", () => {
    // Arrange
    const instant = new Date(2026, 8, 15, 10, 30)
    const iso = instant.toISOString()

    // Act
    const fromDate = formatDateTimeTH(instant)
    const fromString = formatDateTimeTH(iso)

    // Assert
    expect(fromString).toBe(fromDate)
  })

  // Edge case: 29 ก.พ. ปีอธิกสุรทินต้อง format ได้ ไม่ใช่ "-"
  it("Edge case: should handle leap day", () => {
    // Arrange
    const input = new Date(2024, 1, 29, 12, 0)

    // Act
    const result = formatDateTimeTH(input)

    // Assert
    expect(result).not.toBe("-")
    expect(result).toContain("29")
  })
})

describe("formatShortDateTH", () => {
  // Happy path: วันแบบสั้นสำหรับแกน X ของกราฟ เช่น "15 ก.ย."
  it("Happy path: should format a valid Date as short Thai date", () => {
    // Arrange
    const input = new Date(2026, 8, 15)

    // Act
    const result = formatShortDateTH(input)

    // Assert
    expect(result).toBe("15 ก.ย.")
  })

  // Happy path: ISO string ต้องใช้ได้เหมือน Date
  it("Happy path: should accept an ISO string", () => {
    // Arrange
    const input = "2026-09-15T10:30:00+07:00"

    // Act
    const result = formatShortDateTH(input)

    // Assert
    expect(result).toBe("15 ก.ย.")
  })

  // Negative path: ค่าว่าง/ค่าไม่ใช่วันที่ ต้องคืน "-"
  it.each([
    { value: null },
    { value: undefined },
    { value: "" },
    { value: "not-a-date" },
    { value: new Date(NaN) },
  ])("Negative path: invalid input -> -", ({ value }) => {
    // Arrange
    const input = value

    // Act
    const result = formatShortDateTH(input)

    // Assert
    expect(result).toBe("-")
  })

  // Necessary: Date กับ ISO string ของ instant เดียวกันต้องได้ผลเท่ากัน
  it("Necessary: Date and ISO string of the same instant should match", () => {
    // Arrange
    const instant = new Date(2026, 8, 15, 10, 30)
    const iso = instant.toISOString()

    // Act
    const fromDate = formatShortDateTH(instant)
    const fromString = formatShortDateTH(iso)

    // Assert
    expect(fromString).toBe(fromDate)
  })

  // Edge case: 29 ก.พ. ปีอธิกสุรทิน
  it("Edge case: should handle leap day", () => {
    // Arrange
    const input = new Date(2024, 1, 29, 12, 0)

    // Act
    const result = formatShortDateTH(input)

    // Assert
    expect(result).toBe("29 ก.พ.")
  })
})
