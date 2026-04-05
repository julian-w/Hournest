import { expect, test } from '@playwright/test';
import { hasE2ECredentials, loginAsConfiguredUser } from './helpers/auth';

test.describe('authenticated smoke flows', () => {
  test.skip(!hasE2ECredentials(), 'Set E2E_USERNAME and E2E_PASSWORD to run authenticated Playwright tests.');

  test.beforeEach(async ({ page }) => {
    await loginAsConfiguredUser(page);
  });

  test('opens the dashboard for an authenticated user', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('app-dashboard')).toBeVisible();
  });

  test('opens time tracking for an authenticated user', async ({ page }) => {
    await page.goto('/time-tracking');

    await expect(page).toHaveURL(/\/time-tracking$/);
    await expect(page.locator('app-time-tracking')).toBeVisible();
  });
});
