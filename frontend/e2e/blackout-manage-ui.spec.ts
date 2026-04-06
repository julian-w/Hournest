import { expect, test } from '@playwright/test';
import { createBlackout, deleteBlackout, uniqueSuffix } from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, loginInContext } from './helpers/auth';
import { fillDateInput, nextBusinessDayOffset } from './helpers/ui';

test.describe('blackout management ui flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run blackout management UI tests.');

  test('admin edits and deletes an existing blackout in the UI', async ({ browser }) => {
    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const originalReason = `E2E blackout ${suffix}`;
    const updatedReason = `E2E holiday ${suffix}`;
    const originalDate = nextBusinessDayOffset(22);
    const updatedDate = nextBusinessDayOffset(23);

    const adminApi = await createLoggedInApiRequestContext({ ...adminCredentials });
    const blackout = await createBlackout(adminApi, {
      type: 'freeze',
      start_date: originalDate,
      end_date: originalDate,
      reason: originalReason,
    });

    let cleanupNeeded = true;

    try {
      const adminContext = await browser.newContext();
      try {
        await loginInContext(adminContext, adminCredentials);

        const page = await adminContext.newPage();
        await page.goto('/admin/blackouts');
        await expect(page.locator('app-admin-blackouts')).toBeVisible();

        const originalRow = page.locator('tr.mat-mdc-row').filter({ hasText: originalReason }).first();
        await expect(originalRow).toBeVisible();

        await originalRow.locator('button').filter({
          has: page.locator('mat-icon', { hasText: 'edit' }),
        }).click();

        const dialog = page.locator('mat-dialog-container app-blackout-dialog');
        await expect(dialog).toBeVisible();
        await dialog.getByRole('radio', { name: /company holiday/i }).check();
        await fillDateInput(dialog.locator('input[formcontrolname="startDate"]'), updatedDate);
        await fillDateInput(dialog.locator('input[formcontrolname="endDate"]'), updatedDate);
        await dialog.locator('textarea[formcontrolname="reason"]').fill(updatedReason);
        await dialog.getByRole('button', { name: /^save$/i }).click();

        const updatedRow = page.locator('tr.mat-mdc-row').filter({ hasText: updatedReason }).first();
        await expect(updatedRow).toBeVisible();
        await expect(updatedRow).toContainText(/company holiday/i);

        await updatedRow.locator('button').filter({
          has: page.locator('mat-icon', { hasText: 'delete' }),
        }).click();

        await expect(page.locator('mat-snack-bar-container')).toContainText('Entry deleted.');
        await expect(page.locator('tr.mat-mdc-row').filter({ hasText: updatedReason })).toHaveCount(0);
        cleanupNeeded = false;
      } finally {
        await adminContext.close();
      }
    } finally {
      if (cleanupNeeded) {
        await deleteBlackout(adminApi, blackout.id);
      }
      await adminApi.dispose();
    }
  });
});
