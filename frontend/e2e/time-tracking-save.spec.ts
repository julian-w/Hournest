import { expect, test } from '@playwright/test';
import { createLocalEmployee, createTimeEntry, deleteUser, uniqueSuffix } from './helpers/admin-api';
import { getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';

test.describe('time tracking save flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the time-tracking save flow.');

  test('employee saves weekly bookings in the UI after recording time', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();

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

        const employeePage = await employeeContext.newPage();
        await employeePage.goto('/time-tracking');
        await expect(employeePage.locator('app-time-tracking')).toBeVisible();

        const enabledPctInputs = employeePage.locator('app-time-tracking input.pct-input:not([disabled])');
        const enabledTimeInputs = employeePage.locator('app-time-tracking input.time-input:not([disabled])');
        const firstBreakInput = employeePage.locator('app-time-tracking input.break-input:not([disabled])').first();

        const inputCount = await enabledPctInputs.count();
        test.skip(inputCount < 2, 'Not enough editable booking inputs found for the first week grid.');

        const firstTimeInput = enabledTimeInputs.first();
        const firstTimeDate = await firstTimeInput.evaluate((element) => {
          const dayCol = element.closest('.day-col');
          const dateLabel = dayCol?.querySelector('.day-date')?.textContent?.trim();
          return dateLabel ?? '';
        });

        await firstTimeInput.fill('08:00');
        await enabledTimeInputs.nth(1).fill('16:30');
        await firstBreakInput.fill('30');

        const currentYear = new Date().getFullYear();
        const [day, month] = firstTimeDate.replace('.', '').split('.');
        const isoDate = `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        await createTimeEntry(employeeContext.request, {
          date: isoDate,
          startTime: '08:00',
          endTime: '16:30',
          breakMinutes: 30,
        });

        await enabledPctInputs.nth(0).fill('60');
        await enabledPctInputs.nth(1).fill('40');

        const saveButton = employeePage.locator('button').filter({
          has: employeePage.locator('mat-icon', { hasText: 'save' }),
        }).first();

        await saveButton.click();

        await expect(employeePage.locator('app-time-tracking')).toContainText(/saved|gespeichert/i);
      } finally {
        await employeeContext.close();
      }
    } finally {
      await deleteUser(adminContext.request, employee.id);
      await adminContext.close();
    }
  });
});
