import { expect, test } from '@playwright/test';
import { createAbsenceRequest, createLocalEmployee, deleteUser, uniqueSuffix } from './helpers/admin-api';
import { getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';

function nextBusinessDayOffset(baseOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + baseOffset);

  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }

  return date.toISOString().split('T')[0];
}

test.describe('absence cancellation flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the absence cancellation flow.');

  test('employee cancels a pending special-leave request in the UI', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const comment = `E2E absence cancel ${suffix}`;
    const startDate = nextBusinessDayOffset(10);

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

        await createAbsenceRequest(employeeContext.request, {
          startDate,
          endDate: startDate,
          type: 'special_leave',
          comment,
        });

        const employeePage = await employeeContext.newPage();
        await employeePage.goto('/my-absences');

        const row = employeePage.locator('tr.mat-mdc-row').filter({ hasText: comment }).first();
        await expect(row).toBeVisible();
        await row.locator('button[color="warn"]').click();
        await expect(row).toHaveCount(0);
      } finally {
        await employeeContext.close();
      }
    } finally {
      await deleteUser(adminContext.request, employee.id);
      await adminContext.close();
    }
  });
});
