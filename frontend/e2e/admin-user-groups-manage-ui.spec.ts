import { expect, test } from '@playwright/test';
import {
  archiveCostCenter,
  createCostCenter,
  createLocalEmployee,
  deleteUser,
  deleteUserGroup,
  findUserGroupByName,
  uniqueSuffix,
} from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, loginInContext } from './helpers/auth';

test.describe('admin user group management ui flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the admin user group management UI flow.');

  test('admin creates, assigns and deletes a user group in the UI', async ({ browser }) => {
    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const initialName = `E2E Group ${suffix}`;
    const updatedName = `E2E Group Ops ${suffix}`;
    const description = `Group created in UI ${suffix}`;
    const updatedDescription = `Group updated in UI ${suffix}`;

    const adminApi = await createLoggedInApiRequestContext({ ...adminCredentials });
    const employee = await createLocalEmployee(adminApi, suffix);
    const costCenter = await createCostCenter(adminApi, {
      code: `E2E-GRP-${suffix}`.slice(0, 24),
      name: `E2E Group CC ${suffix}`,
      description: 'Assigned in UI flow',
    });

    try {
      const adminContext = await browser.newContext();
      try {
        await loginInContext(adminContext, adminCredentials);

        const page = await adminContext.newPage();
        const snackBar = page.locator('mat-snack-bar-container').last();
        await page.goto('/admin/user-groups');
        await expect(page.locator('app-admin-user-groups')).toBeVisible();

        await page.getByRole('button', { name: /add group/i }).click();
        const createDialog = page.locator('mat-dialog-container app-group-name-dialog');
        await expect(createDialog).toBeVisible();
        await createDialog.locator('input').fill(initialName);
        await createDialog.locator('textarea').fill(description);
        await createDialog.getByRole('button', { name: /^save$/i }).click();

        const groupCard = () => page.locator('mat-card.group-card').filter({ hasText: updatedName }).first();
        const initialGroupCard = () => page.locator('mat-card.group-card').filter({ hasText: initialName }).first();
        await expect(initialGroupCard()).toBeVisible();

        await initialGroupCard().locator('button').filter({
          has: page.locator('mat-icon', { hasText: 'edit' }),
        }).click();

        const editDialog = page.locator('mat-dialog-container app-group-name-dialog');
        await expect(editDialog).toBeVisible();
        await editDialog.locator('input').evaluate((element, value) => {
          const input = element as HTMLInputElement;
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }, updatedName);
        await editDialog.locator('textarea').fill(updatedDescription);
        await editDialog.getByRole('button', { name: /^save$/i }).click();

        await expect(groupCard()).toBeVisible();
        await expect(groupCard()).toContainText(updatedDescription);

        await groupCard().locator('button').filter({
          has: page.locator('mat-icon', { hasText: 'people' }),
        }).click();

        const membersDialog = page.locator('mat-dialog-container app-group-members-dialog');
        await expect(membersDialog).toBeVisible();
        await membersDialog.getByText(employee.displayName, { exact: false }).click();
        await membersDialog.getByRole('button', { name: /^save$/i }).click();

        await groupCard().locator('button').filter({
          has: page.locator('mat-icon', { hasText: 'account_tree' }),
        }).click();

        const costCentersDialog = page.locator('mat-dialog-container app-group-cost-centers-dialog');
        await expect(costCentersDialog).toBeVisible();
        await costCentersDialog.getByText(costCenter.name, { exact: false }).click();
        await costCentersDialog.getByRole('button', { name: /^save$/i }).click();

        await expect(groupCard()).toContainText(employee.displayName);
        await expect(groupCard()).toContainText(costCenter.name);

        await groupCard().locator('button').filter({
          has: page.locator('mat-icon', { hasText: 'delete' }),
        }).click();

        await expect(snackBar).toContainText('Group deleted.');
        await expect(page.locator('mat-card.group-card').filter({ hasText: updatedName })).toHaveCount(0);
      } finally {
        await adminContext.close();
      }
    } finally {
      const createdGroup = await findUserGroupByName(adminApi, updatedName)
        ?? await findUserGroupByName(adminApi, initialName);
      if (createdGroup) {
        await deleteUserGroup(adminApi, createdGroup.id);
      }
      await deleteUser(adminApi, employee.id);
      await archiveCostCenter(adminApi, costCenter.id);
      await adminApi.dispose();
    }
  });
});
