import { expect, test } from '@playwright/test';
import { createLocalEmployee, deleteUser, uniqueSuffix } from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, loginInContext } from './helpers/auth';
import { fillDateInput, nextBusinessDayOffset } from './helpers/ui';

test.describe('admin absence management ui flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the admin absence management UI flow.');

  test('admin creates an absence in the UI and removes it again from the all tab', async ({ browser }) => {
    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const startDate = nextBusinessDayOffset(25);
    const adminComment = `E2E admin created absence ${suffix}`;

    const adminApi = await createLoggedInApiRequestContext({ ...adminCredentials });
    const employee = await createLocalEmployee(adminApi, suffix);

    try {
      const adminContext = await browser.newContext();
      try {
        await loginInContext(adminContext, adminCredentials);

        const page = await adminContext.newPage();
        await page.goto('/admin/absences');
        await expect(page.locator('app-admin-absences')).toBeVisible();

        await page.getByRole('button', { name: /create absence/i }).click();
        const dialog = page.locator('mat-dialog-container app-create-absence-dialog');
        await expect(dialog).toBeVisible();

        await dialog.locator('mat-select').nth(0).click();
        await page.getByRole('option', { name: employee.displayName }).click();
        await dialog.locator('mat-select').nth(1).click();
        await page.getByRole('option', { name: /special leave/i }).click();
        await dialog.locator('mat-select').nth(2).click();
        await page.getByRole('option', { name: /morning/i }).click();
        await fillDateInput(dialog.locator('input').nth(0), startDate);
        await fillDateInput(dialog.locator('input').nth(1), startDate);
        await dialog.locator('textarea').fill(adminComment);
        await dialog.getByRole('button', { name: /^save$/i }).click();

        const allTab = page.getByRole('tab', { name: /all/i });
        await allTab.click();

        const row = page.locator('tr.mat-mdc-row').filter({ hasText: employee.displayName }).filter({ hasText: 'Created by Admin' }).first();
        await expect(row).toBeVisible();

        await row.locator('button').filter({
          has: page.locator('mat-icon', { hasText: 'delete' }),
        }).click();

        await expect(page.locator('mat-snack-bar-container')).toContainText('Absence removed.');
        await expect(page.locator('tr.mat-mdc-row').filter({ hasText: employee.displayName }).filter({ hasText: 'Created by Admin' })).toHaveCount(0);
      } finally {
        await adminContext.close();
      }
    } finally {
      await deleteUser(adminApi, employee.id);
      await adminApi.dispose();
    }
  });
});
