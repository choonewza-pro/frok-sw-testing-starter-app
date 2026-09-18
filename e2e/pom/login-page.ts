import { type Locator, type Page } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole("textbox", { name: "อีเมล" });
    this.passwordInput = page.getByRole("textbox", { name: "รหัสผ่าน" });
    this.submitButton = page.getByRole("button", { name: "เข้าสู่ระบบ" });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForURL("");
  }

  async goto() {
    await this.page.goto("/login");
  }
}