import { expect, test } from '@playwright/test';
import { archiveCostCenter, findCostCenterByCode, uniqueSuffix } from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, loginInContext } from './helpers/auth';

test.describe('admin cost center management ui flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the admin cost center management UI flow.');

  test('admin creates, edits and archives a cost center in the UI', async ({ browser }) => {
    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const code = `E2E-CC-${suffix}`.slice(0, 24);
    const initialName = `E2E Cost Center ${suffix}`;
    const updatedName = `E2E Updated CC ${suffix}`;
    const initialDescription = `Created via UI ${suffix}`;
    const updatedDescription = `Updated via UI ${suffix}`;

    const adminApi = await createLoggedInApiRequestContext({ ...adminCredentials });

    try {
      const adminContext = await browser.newContext();
      try {
        await loginInContext(adminContext, adminCredentials);

        const page = await adminContext.newPage();
        const snackBar = page.locator('mat-snack-bar-container').last();
        await page.goto('/admin/cost-centers');
        await expect(page.locator('app-admin-cost-centers')).toBeVisible();

        await page.getByRole('button', { name: /add cost center/i }).click();
        const createDialog = page.locator('mat-dialog-container app-cost-center-dialog');
        await expect(createDialog).toBeVisible();

        await createDialog.locator('input').nth(0).fill(code);
        await createDialog.locator('input').nth(1).fill(initialName);
        await createDialog.locator('textarea').fill(initialDescription);
        await createDialog.getByRole('button', { name: /^save$/i }).click();

        const row = () => page.locator('tr.mat-mdc-row').filter({ hasText: code }).first();
        await expect(row()).toBeVisible();
        await expect(row()).toContainText(initialName);

        await row().locator('button').filter({
          has: page.locator('mat-icon', { hasText: 'edit' }),
        }).click();

        const editDialog = page.locator('mat-dialog-container app-cost-center-dialog');
        await expect(editDialog).toBeVisible();
        await editDialog.locator('input').nth(1).evaluate((element, value) => {
          const input = element as HTMLInputElement;
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }, updatedName);
        await editDialog.locator('textarea').fill(updatedDescription);
        await editDialog.getByRole('button', { name: /^save$/i }).click();

        await expect(row()).toContainText(updatedName);

        await row().locator('button').filter({
          has: page.locator('mat-icon', { hasText: 'archive' }),
        }).click();

        await expect(snackBar).toContainText('Cost center archived.');
        await expect(row()).toContainText(/inactive/i);

        const storedCostCenter = await findCostCenterByCode(adminApi, code);
        expect(storedCostCenter).toBeDefined();
        expect(storedCostCenter?.name).toBe(updatedName);
        expect(storedCostCenter?.is_active).toBe(false);
      } finally {
        await adminContext.close();
      }
    } finally {
      const createdCostCenter = await findCostCenterByCode(adminApi, code);
      if (createdCostCenter?.is_active) {
        await archiveCostCenter(adminApi, createdCostCenter.id);
      }
      await adminApi.dispose();
    }
  });
});
