import type { Page } from "@playwright/test";

/** Page Object: ฟอร์ม login (/login) */
export class LoginPage {
  constructor(private readonly page: Page) {}

  readonly email = this.page.getByTestId("login-email");
  readonly password = this.page.getByTestId("login-password");
  readonly submit = this.page.getByTestId("login-submit");
  readonly userName = this.page.getByTestId("nav-user-name");
  readonly loginLink = this.page.getByTestId("nav-login");

  async goto(): Promise<void> {
    await this.page.goto("/login");
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
