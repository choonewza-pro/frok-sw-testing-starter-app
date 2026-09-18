import { test, expect } from '@playwright/test';
import { authFile } from '../playwright.config';
import { LoginPage } from './pom/login-page';

//ล็อกอินด้วยบัญชี admin และบันทึก session ไว้ในไฟล์ auth.json
test('authenticate as admin and save session', async ({ page }) => {
    // await page.goto('/login');
    // const email = page.getByRole('textbox', { name: 'อีเมล' });
    // const password = page.getByRole('textbox', { name: 'รหัสผ่าน' });
    // await email.fill(process.env.ADMIN_USER || '');
    // await password.fill(process.env.ADMIN_PASSWORD || '');
    // const submitBtn = page.getByRole('button', { name: 'เข้าสู่ระบบ' });
    // await submitBtn.click();

    const loginPage: LoginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(process.env.ADMIN_USER!, process.env.ADMIN_PASSWORD!);

    await expect(page.getByText('สินค้าคุณภาพ')).toBeVisible();
    await page.context().storageState({ path: authFile });
});