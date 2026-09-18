import { test, expect, type Page } from "@playwright/test";

/**
 * TEST_1.5 Contact Us (P0, Risk 15)
 *
 * Implementation note: .env ไม่มี RESEND_API_KEY/CONTACT_* (EMPTY)
 * ดังนั้น submit ที่ valid จะได้ contact-error "ยังไม่ได้ตั้งค่า" ไม่ใช่ success —
 * เคส T1 assert ตามจริง (deterministic) ถ้าวันไหนตั้งค่า Resend แล้วค่อย flip เป็น success
 */
const VALID = {
  name: "สมชาย ใจดี",
  email: "somchai@example.com",
  subject: "สอบถามสินค้า",
  message: "ขอรายละเอียดการจัดส่งสินค้าหน่อยครับ ขอบคุณมาก",
};

async function fillContact(page: Page, values: typeof VALID): Promise<void> {
  await page.getByTestId("contact-name").fill(values.name);
  await page.getByTestId("contact-email").fill(values.email);
  await page.getByTestId("contact-subject").fill(values.subject);
  await page.getByTestId("contact-message").fill(values.message);
}

test.describe("Contact us", () => {
  test("shows not-configured error when submitting valid form without email setup", async ({
    page,
  }) => {
    await page.goto("/contact");
    await fillContact(page, VALID);
    await page.getByTestId("contact-submit").click();

    await expect(page.getByTestId("contact-error")).toContainText("ยังไม่ได้ตั้งค่า");
    await expect(page.getByTestId("contact-success")).toBeHidden();
  });

  test("shows field errors when submitting empty form", async ({ page }) => {
    await page.goto("/contact");
    await page.getByTestId("contact-submit").click();

    await expect(page.getByText("ชื่อต้องมีอย่างน้อย 2 ตัวอักษร")).toBeVisible();
    await expect(page.getByText("หัวข้อต้องมีอย่างน้อย 3 ตัวอักษร")).toBeVisible();
    await expect(page.getByText("ข้อความต้องมีอย่างน้อย 10 ตัวอักษร")).toBeVisible();
    await expect(page.getByTestId("contact-success")).toBeHidden();
  });

  test("shows field error when email format invalid", async ({ page }) => {
    await page.goto("/contact");
    await fillContact(page, { ...VALID, email: "not-an-email" });
    await page.getByTestId("contact-submit").click();

    await expect(page.getByText("รูปแบบอีเมลไม่ถูกต้อง")).toBeVisible();
    await expect(page.getByTestId("contact-success")).toBeHidden();
  });

  test("shows field error when message too short", async ({ page }) => {
    await page.goto("/contact");
    await fillContact(page, { ...VALID, message: "สั้นไป" });
    await page.getByTestId("contact-submit").click();

    await expect(page.getByText("ข้อความต้องมีอย่างน้อย 10 ตัวอักษร")).toBeVisible();
  });

  test("returns fake success without sending when honeypot filled", async ({ page }) => {
    await page.goto("/contact");
    await fillContact(page, VALID);
    // ช่องกับดักบอท (ซ่อนด้วย css นอกจอ แต่ยังมีขนาด — fill ได้)
    await page.locator("#contact-website").fill("i-am-a-bot");
    await page.getByTestId("contact-submit").click();

    // handleContactSubmission ตอบ ok:true ทันทีโดยไม่ส่งอีเมล (ไม่ให้บอทรู้ว่าถูกจับ)
    await expect(page.getByTestId("contact-success")).toBeVisible();
    await expect(page.getByTestId("contact-error")).toBeHidden();
  });
});
