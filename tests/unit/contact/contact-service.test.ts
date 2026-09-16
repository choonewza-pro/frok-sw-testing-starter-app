import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { contactSchema } from "@/lib/contact-schema"
import { handleContactSubmission } from "@/lib/contact/contact-service"
import type { ContactEmailSender } from "@/lib/contact/email-sender"
import { isBotSubmission } from "@/lib/contact/honeypot"

const createSubmission = () => ({
  name: "สมชาย ใจดี",
  email: "somchai@gmail.com",
  subject: "สอบถามสินค้า",
  message: "สนใจ iPhone 16 Pro ขอรายละเอียดการผ่อนชำระด้วยครับ",
})

const createSender = (result: { ok: boolean; status?: number } = { ok: true }) =>
  vi.fn<ContactEmailSender>().mockResolvedValue(result)

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("isBotSubmission", () => {
  it.each([undefined, null, "", "   "])(
    "should treat %s as a human submission",
    (website) => {
      // Arrange
      const input = website as string | undefined | null

      // Act
      const result = isBotSubmission(input)

      // Assert
      expect(result).toBe(false)
    },
  )

  it("should treat a filled honeypot field as a bot submission", () => {
    // Arrange
    const website = "http://spam.example.com"

    // Act
    const result = isBotSubmission(website)

    // Assert
    expect(result).toBe(true)
  })
})

describe("contact field validation", () => {
  it("should accept a fully valid submission", () => {
    // Arrange
    const submission = createSubmission()

    // Act
    const result = contactSchema.safeParse(submission)

    // Assert
    expect(result.success).toBe(true)
  })

  it.each([
    { field: "name", value: "ก", reason: "below minimum length" },
    { field: "name", value: "ก".repeat(101), reason: "above maximum length" },
    { field: "subject", value: "ถา", reason: "below minimum length" },
    {
      field: "subject",
      value: "ก".repeat(151),
      reason: "above maximum length",
    },
    { field: "message", value: "สนใจครับ", reason: "below minimum length" },
    {
      field: "message",
      value: "ก".repeat(2001),
      reason: "above maximum length",
    },
    { field: "email", value: "user-at-mail", reason: "invalid format" },
    { field: "email", value: "", reason: "required but empty" },
  ])(
    "should reject $field $reason",
    ({ field, value }: { field: string; value: string }) => {
      // Arrange
      const submission = { ...createSubmission(), [field]: value }

      // Act
      const result = contactSchema.safeParse(submission)

      // Assert
      expect(result.success).toBe(false)
    },
  )
})

describe("handleContactSubmission", () => {
  describe("bot handling", () => {
    it("should return ok without sending email when the honeypot is filled", async () => {
      // Arrange
      const sender = createSender()
      const submission = { ...createSubmission(), website: "http://spam.com" }

      // Act
      const result = await handleContactSubmission(submission, {
        createSender: () => sender,
      })

      // Assert
      expect(result).toEqual({ ok: true })
      expect(sender).not.toHaveBeenCalled()
    })
  })

  describe("validation short-circuit", () => {
    it("should return field errors without calling the sender when input is invalid", async () => {
      // Arrange
      const sender = createSender()
      const submission = { ...createSubmission(), message: "สนใจครับ" }

      // Act
      const result = await handleContactSubmission(submission, {
        createSender: () => sender,
      })

      // Assert
      expect(result.ok).toBe(false)
      expect(result.fieldErrors?.message).toBeDefined()
      expect(sender).not.toHaveBeenCalled()
    })
  })

  describe("sender wiring", () => {
    it("should return notConfigured message when email is not set up", async () => {
      // Arrange
      const submission = createSubmission()

      // Act
      const result = await handleContactSubmission(submission, {
        createSender: () => null,
      })

      // Assert
      expect(result).toEqual({
        ok: false,
        message: "ระบบยังไม่ได้ตั้งค่าการส่งอีเมล กรุณาติดต่อทีมงาน",
      })
    })

    it("should return sendFailed message when the email provider rejects", async () => {
      // Arrange
      const sender = createSender({ ok: false, status: 500 })

      // Act
      const result = await handleContactSubmission(createSubmission(), {
        createSender: () => sender,
      })

      // Assert
      expect(result).toEqual({
        ok: false,
        message: "ไม่สามารถส่งข้อความได้ในขณะนี้ กรุณาลองใหม่ภายหลัง",
      })
      expect(sender).toHaveBeenCalledTimes(1)
    })

    it("should return sendFailed message when the sender throws", async () => {
      // Arrange
      const sender = vi
        .fn<ContactEmailSender>()
        .mockRejectedValue(new Error("network down"))

      // Act
      const result = await handleContactSubmission(createSubmission(), {
        createSender: () => sender,
      })

      // Assert
      expect(result).toEqual({
        ok: false,
        message: "ไม่สามารถส่งข้อความได้ในขณะนี้ กรุณาลองใหม่ภายหลัง",
      })
    })

    it("should send trimmed values when submission succeeds", async () => {
      // Arrange
      const sender = createSender()
      const submission = {
        ...createSubmission(),
        name: "  สมชาย ใจดี  ",
      }

      // Act
      const result = await handleContactSubmission(submission, {
        createSender: () => sender,
      })

      // Assert
      expect(result).toEqual({ ok: true })
      expect(sender).toHaveBeenCalledWith(
        expect.objectContaining({ name: "สมชาย ใจดี" }),
      )
    })
  })
})
