import { test } from '@playwright/test';
import path from 'node:path';

const VIEWPORTS = [
  { name: '320px', width: 320, height: 568 },
  { name: '375px', width: 375, height: 667 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1024px', width: 1024, height: 768 },
  { name: '1440px', width: 1440, height: 900 },
];

const PAGES = [
  { name: 'Dashboard', url: '/' },
  { name: 'Doctors', url: '/doctors' },
  { name: 'Availability', url: '/availability' },
  { name: 'Appointments List', url: '/appointments' },
  {
    name: 'Appointment Details',
    url: '/appointments/f6bd9042-9e96-4525-8300-0286f8d75a73',
  },
];

const SCREENSHOT_DIR = path.join(process.cwd(), 'audit-screenshots');

async function loginAndSaveState(browser: any) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/login');
  await page.getByTestId('email-input').fill('nguyenduchuy1968@gmail.com');
  await page.getByTestId('password-input').fill('Admin123456');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL('/');
  await context.storageState({ path: 'playwright/.auth/user.json' });
  await context.close();
}

test.describe('Responsiveness Audit', () => {
  test.describe.configure({ mode: 'serial' });

  test('login and save state', async ({ browser }) => {
    await loginAndSaveState(browser);
  });

  for (const pageInfo of PAGES) {
    for (const viewport of VIEWPORTS) {
      test(`${pageInfo.name} at ${viewport.name}`, async ({ browser }) => {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          storageState: 'playwright/.auth/user.json',
        });
        const page = await context.newPage();

        await page.goto(pageInfo.url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: path.join(
            SCREENSHOT_DIR,
            `${pageInfo.name.replace(/\s+/g, '-')}_${viewport.name}.png`
          ),
          fullPage: true,
        });

        await context.close();
      });
    }
  }
});
