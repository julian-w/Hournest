import { expect, test } from '@playwright/test';
import { hasAdminE2ECredentials, loginAsConfiguredUser } from './helpers/auth';

test.describe('admin smoke flows', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set E2E_USERNAME, E2E_PASSWORD, and E2E_ROLE=admin|superadmin to run admin Playwright tests.');

  test.beforeEach(async ({ page }) => {
    await loginAsConfiguredUser(page);
  });

  test('opens the admin request review screen', async ({ page }) => {
    await page.goto('/admin/requests');

    await expect(page).toHaveURL(/\/admin\/requests$/);
    await expect(page.locator('app-admin-requests')).toBeVisible();
  });
});
