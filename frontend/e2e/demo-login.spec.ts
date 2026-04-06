import { expect, test } from '@playwright/test';

test.describe('demo login credentials', () => {
  test('shows the public demo credentials and fills the local login form', async ({ page }) => {
    await page.goto('/login');

    const credentialsCard = page.getByTestId('demo-login-credentials');
    await expect(credentialsCard).toBeVisible();
    await expect(credentialsCard).toContainText('anna.admin@demo.hournest.local');
    await expect(credentialsCard).toContainText('Max Mustermann');
    await expect(credentialsCard).toContainText('playwright-demo-user-password');

    await page.getByTestId('demo-user-admin').click();

    await expect(page.locator('input[name="username"]')).toHaveValue('anna.admin@demo.hournest.local');
    await expect(page.locator('input[name="password"]')).toHaveValue('playwright-demo-user-password');

    await page.screenshot({
      path: 'test-results/demo-login-credentials.png',
      fullPage: true,
    });
  });
});
