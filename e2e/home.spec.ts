import { test,expect } from '@playwright/test';

// ไม่ใช้ auth state เพราะเราต้องการทดสอบหน้าแรกของเว็บไซต์โดยไม่ต้องล็อกอิน
test.use({ storageState: {
    cookies: [],
    origins: []
} });

test('verify logo is visible on home page', async ({page}) => {
    await page.goto('');
    
    const logo = page.getByRole('img', { name: 'Next.js' });

    await expect(logo).toBeVisible();
})

test('verify login navition link from homepage', async ({page}) => {
    await page.goto('');
    
    const loginLink = page.getByRole('link', { name: 'เข้าสู่ระบบ' });
    await expect(loginLink).toBeVisible();

    await loginLink.click();
    await expect(page).toHaveURL('/login');
})

// test('login successfully when valid credentials', async ({ page }) => {
//     await page.goto('/login');
//     const email = page.getByRole('textbox', { name: 'อีเมล' });
//     const password = page.getByRole('textbox', { name: 'รหัสผ่าน'});
//     await email.fill('admin@test.com');
//     await password.fill('12345678');
//     const submitBtn = page.getByRole('button', { name: 'เข้าสู่ระบบ' });
//     await submitBtn.click();
//     await page.waitForURL('');
//     await expect(page).toHaveURL('');
// });
