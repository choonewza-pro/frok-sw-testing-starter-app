import type { Locator, Page } from "@playwright/test";

/** Page Object: จัดการสินค้าฝั่ง admin (/admin/products) */
export class AdminProductsPage {
  constructor(private readonly page: Page) {}

  readonly root = this.page.getByTestId("products-admin");
  readonly search = this.page.getByTestId("product-search");
  readonly createButton = this.page.getByTestId("product-create");
  readonly dialog = this.page.getByTestId("product-form-dialog");
  readonly nameInput = this.page.getByTestId("product-name-input");
  readonly descriptionInput = this.page.getByTestId("product-description-input");
  readonly priceInput = this.page.getByTestId("product-price-input");
  readonly categorySelect = this.page.getByTestId("product-category-select");
  readonly submitButton = this.page.getByTestId("product-form-submit");
  readonly rows = this.page.getByTestId("product-row");

  async goto(): Promise<void> {
    await this.page.goto("/admin/products");
  }

  rowByName(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  rowByProductId(id: number): Locator {
    return this.page.locator(`[data-testid="product-row"][data-product-id="${id}"]`);
  }

  /** เลือกหมวดหมู่แรกสุด (Radix Select render options ใน portal — ใช้ role=option) */
  async selectFirstCategory(): Promise<void> {
    await this.categorySelect.click();
    await this.page.getByRole("option").first().click();
  }

  async createProduct(name: string, price: string): Promise<void> {
    await this.createButton.click();
    await this.nameInput.fill(name);
    await this.descriptionInput.fill(`E2E product ${name}`);
    await this.priceInput.fill(price);
    await this.selectFirstCategory();
    await this.submitButton.click();
  }
}
