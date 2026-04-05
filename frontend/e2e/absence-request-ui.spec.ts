import { expect, test } from '@playwright/test';
import { createLocalEmployee, deleteUser, uniqueSuffix } from './helpers/admin-api';
import { getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { fillDateInput, nextBusinessDayOffset } from './helpers/ui';

test.describe('absence request ui flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the absence request UI flow.');

  test('employee submits a special-leave request through the dialog', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const comment = `E2E absence ui ${suffix}`;
    const startDate = nextBusinessDayOffset(11);

    const adminContext = await browser.newContext();
    await loginInContext(adminContext, adminCredentials);
    const employee = await createLocalEmployee(adminContext.request, suffix);

    try {
      const employeeContext = await browser.newContext();
      try {
        await loginInContext(employeeContext, {
          username: employee.email,
          password: employee.password,
        });

        const page = await employeeContext.newPage();
        await page.goto('/my-absences');
        await expect(page.locator('app-my-absences')).toBeVisible();

        await page.getByRole('button').filter({ has: page.locator('mat-icon', { hasText: 'event_note' }) }).first().click();
        await expect(page.locator('mat-dialog-container app-report-absence-dialog')).toBeVisible();

        await fillDateInput(page.locator('mat-dialog-container input').nth(0), startDate);
        await fillDateInput(page.locator('mat-dialog-container input').nth(1), startDate);
        await page.locator('mat-dialog-container textarea').fill(comment);
        await page.getByRole('button', { name: /save|speichern/i }).click();

        const row = page.locator('tr.mat-mdc-row').filter({ hasText: comment }).first();
        await expect(row).toBeVisible();
        await expect(row).toContainText(/pending|offen/i);
      } finally {
        await employeeContext.close();
      }
    } finally {
      await deleteUser(adminContext.request, employee.id);
      await adminContext.close();
    }
  });
});
