import { expect, test } from '@playwright/test';
import { getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { fillDateInput } from './helpers/ui';

function nextBusinessDayOffset(baseOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + baseOffset);

  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }

  return date.toISOString().split('T')[0];
}

test.describe('vacation approval flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the vacation approval flow.');

  test('admin approves a vacation request and the employee sees the approved status', async ({ browser, request }) => {
    await expect.poll(async () => isLocalLoginEnabled(request)).toBeTruthy();

    const adminCredentials = getConfiguredCredentials();
    const employeeCredentials = {
      username: 'e2e.employee@hournest.local',
      password: 'e2e-password',
    };
    const suffix = Date.now().toString();
    const comment = `E2E vacation ${suffix}`;
    const startDate = nextBusinessDayOffset(10);

    const adminContext = await browser.newContext();
    const employeeContext = await browser.newContext();

    try {
      await loginInContext(adminContext, adminCredentials);
      await loginInContext(employeeContext, employeeCredentials);

      const employeePage = await employeeContext.newPage();
      await employeePage.goto('/my-vacations');
      await expect(employeePage.locator('app-my-vacations')).toBeVisible();

      await employeePage.getByRole('button').filter({ has: employeePage.locator('mat-icon', { hasText: 'add' }) }).first().click();
      await expect(employeePage.locator('mat-dialog-container app-vacation-dialog')).toBeVisible();
      await fillDateInput(employeePage.locator('input[formcontrolname="startDate"]'), startDate);
      await fillDateInput(employeePage.locator('input[formcontrolname="endDate"]'), startDate);
      await employeePage.locator('textarea[formcontrolname="comment"]').fill(comment);
      await employeePage.getByRole('button', { name: /submit|beantragen/i }).click();
      await expect(employeePage.locator('mat-dialog-container')).toHaveCount(0);

      await employeePage.goto('/my-vacations');
      const pendingRow = employeePage.locator('tr.mat-mdc-row').filter({ hasText: comment }).first();
      await expect(pendingRow).toBeVisible();
      await expect(pendingRow).toContainText(/pending|offen/i);

      const adminPage = await adminContext.newPage();
      await adminPage.goto('/admin/requests');
      await expect(adminPage.locator('app-admin-requests')).toBeVisible();

      const matchingRow = adminPage.locator('tr.mat-mdc-row').filter({
        hasText: 'E2E Employee',
      }).first();

      await expect(matchingRow).toBeVisible();
      await matchingRow.locator('input[matinput]').fill('E2E approved');
      await matchingRow.locator('button[color="primary"]').click();
      await expect(matchingRow).toHaveCount(0);

      await employeePage.goto('/my-vacations');
      const employeeRow = employeePage.locator('tr.mat-mdc-row').filter({
        hasText: 'E2E approved',
      }).first();

      await expect(employeeRow).toBeVisible();
      await expect(employeeRow).toContainText(/approved|genehmigt/i);
    } finally {
      await employeeContext.close();
      await adminContext.close();
    }
  });
});
