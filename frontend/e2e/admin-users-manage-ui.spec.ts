import { expect, test } from '@playwright/test';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, loginInContext } from './helpers/auth';
import { deleteUser, findUserByEmail, uniqueSuffix } from './helpers/admin-api';

test.describe('admin user management ui flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the admin user management UI flow.');

  test('admin creates, updates and deletes a user in the UI', async ({ browser }) => {
    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const displayName = `E2E UI User ${suffix}`;
    const email = `e2e.ui.user.${suffix}@example.test`;
    const password = `E2E-pass-${suffix}`;

    const adminApi = await createLoggedInApiRequestContext({ ...adminCredentials });

    try {
      const adminContext = await browser.newContext();
      try {
        await loginInContext(adminContext, adminCredentials);

        const page = await adminContext.newPage();
        await page.goto('/admin/users');
        await expect(page.locator('app-admin-users')).toBeVisible();

        await page.getByRole('button', { name: /create user/i }).click();
        const dialog = page.locator('mat-dialog-container app-create-user-dialog');
        await expect(dialog).toBeVisible();

        await dialog.locator('input[formcontrolname="display_name"]').fill(displayName);
        await dialog.locator('input[formcontrolname="email"]').fill(email);
        await dialog.locator('input[formcontrolname="vacation_days_per_year"]').fill('28');
        await dialog.locator('input[formcontrolname="password"]').fill(password);
        await dialog.getByRole('button', { name: /^save$/i }).click();

        const createdUser = await findUserByEmail(adminApi, email);
        expect(createdUser).toBeDefined();
        const createdUserId = createdUser!.id;

        const userRow = () => page.locator('tr.mat-mdc-row').filter({ hasText: email }).first();
        await expect(userRow()).toBeVisible();

        const roleUpdateResponse = page.waitForResponse(response =>
          response.url().includes(`/api/admin/users/${createdUserId}`) &&
          response.request().method() === 'PATCH' &&
          response.ok()
        );
        const roleReloadResponse = page.waitForResponse(response =>
          response.url().endsWith('/api/admin/users') &&
          response.request().method() === 'GET' &&
          response.ok()
        );
        await userRow().getByRole('combobox').click();
        await page.getByRole('option', { name: /^admin$/i }).click();
        await roleUpdateResponse;
        await roleReloadResponse;
        await expect(userRow()).toContainText('Admin');

        const updateDaysResponse = page.waitForResponse(response =>
          response.url().includes(`/api/admin/users/${createdUserId}`) &&
          response.request().method() === 'PATCH' &&
          response.ok()
        );
        const updateDaysReloadResponse = page.waitForResponse(response =>
          response.url().endsWith('/api/admin/users') &&
          response.request().method() === 'GET' &&
          response.ok()
        );
        await userRow().locator('input[type="number"]').evaluate((element, value) => {
          const input = element as HTMLInputElement;
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }, '31');
        await updateDaysResponse;
        await updateDaysReloadResponse;
        await expect(userRow().locator('input[type="number"]')).toHaveValue('31');

        const storedUser = await findUserByEmail(adminApi, email);
        expect(storedUser).toBeDefined();
        expect(storedUser?.role).toBe('admin');
        expect(storedUser?.vacation_days_per_year).toBe(31);

        page.once('dialog', dialogEvent => dialogEvent.accept());
        await userRow().locator('button').filter({
          has: page.locator('mat-icon', { hasText: 'delete' }),
        }).click();

        await expect(page.locator('tr.mat-mdc-row').filter({ hasText: email })).toHaveCount(0);
      } finally {
        await adminContext.close();
      }
    } finally {
      const createdUser = await findUserByEmail(adminApi, email);
      if (createdUser) {
        await deleteUser(adminApi, createdUser.id);
      }
      await adminApi.dispose();
    }
  });
});
