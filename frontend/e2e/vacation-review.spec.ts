import { expect, test } from '@playwright/test';
import { createLocalEmployee, createVacationRequest, deleteUser, uniqueSuffix } from './helpers/admin-api';
import { getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';

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
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const comment = `E2E vacation ${suffix}`;
    const startDate = nextBusinessDayOffset(10);
    const endDate = startDate;

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

        await createVacationRequest(employeeContext.request, {
          startDate,
          endDate,
          comment,
        });

        const adminPage = await adminContext.newPage();
        await adminPage.goto('/admin/requests');

        await expect(adminPage.locator('app-admin-requests')).toBeVisible();
        const matchingRow = adminPage.locator('tr.mat-mdc-row').filter({
          hasText: employee.displayName,
        }).filter({
          hasText: comment,
        }).first();

        await expect(matchingRow).toBeVisible();
        await matchingRow.locator('input[matinput]').fill('E2E approved');
        await matchingRow.locator('button[color="primary"]').click();

        await expect(matchingRow).toHaveCount(0);

        const employeePage = await employeeContext.newPage();
        await employeePage.goto('/my-vacations');

        await expect(employeePage.locator('app-my-vacations')).toBeVisible();
        const employeeRow = employeePage.locator('tr.mat-mdc-row').filter({
          hasText: comment,
        }).first();

        await expect(employeeRow).toBeVisible();
        await expect(employeeRow).toContainText(/approved|genehmigt/i);
      } finally {
        await employeeContext.close();
      }
    } finally {
      await deleteUser(adminContext.request, employee.id);
      await adminContext.close();
    }
  });
});
