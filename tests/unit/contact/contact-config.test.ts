import { describe, expect, it } from "vitest"
import { getContactEmailConfig } from "@/lib/contact/contact-config"

const fullEnv = {
  ...process.env,
  RESEND_API_KEY: "re_test_key",
  CONTACT_FROM_EMAIL: "shop@example.com",
  CONTACT_TO_EMAIL: "owner@example.com",
}

describe("getContactEmailConfig", () => {
  it("should return the config when all values are set", () => {
    // Arrange
    const env = { ...fullEnv }

    // Act
    const result = getContactEmailConfig(env)

    // Assert
    expect(result).toEqual({
      apiKey: "re_test_key",
      fromEmail: "shop@example.com",
      toEmail: "owner@example.com",
    })
  })

  it.each([{ key: "RESEND_API_KEY" }, { key: "CONTACT_FROM_EMAIL" }, { key: "CONTACT_TO_EMAIL" }])(
    "should return null when $key is missing",
    ({ key }) => {
      // Arrange
      const env = { ...fullEnv, [key]: undefined }

      // Act
      const result = getContactEmailConfig(env)

      // Assert
      expect(result).toBeNull()
    },
  )
})
