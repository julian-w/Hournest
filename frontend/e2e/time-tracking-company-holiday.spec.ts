import { expect, test } from '@playwright/test';
import { createBlackout, createLocalEmployee, deleteBlackout, deleteUser, getHolidays, uniqueSuffix } from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { currentWeekIsoDates, isWeekendIsoDate } from './helpers/ui';

test.describe('time tracking company holiday flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the company-holiday flow.');

  test('employee sees company-holiday days locked in the weekly grid', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminApi = await createLoggedInApiRequestContext({ ...getConfiguredCredentials() });
    const employee = await createLocalEmployee(adminApi, uniqueSuffix());
    const employeeCredentials = {
      username: employee.email,
      password: employee.password,
    };

    try {
      const employeeApi = await createLoggedInApiRequestContext(employeeCredentials);
      await employeeApi.dispose();

      const weekDates = currentWeekIsoDates(1);
      const years = [...new Set(weekDates.map(date => Number(date.slice(0, 4))))];
      const holidaysByYear = await Promise.all(years.map(year => getHolidays(adminApi, year)));
      const holidayDates = new Set(holidaysByYear.flat().map(holiday => holiday.date));
      const holidayDate = weekDates.find(date => !isWeekendIsoDate(date) && !holidayDates.has(date)) ?? weekDates[1];
      const holidayIndex = weekDates.indexOf(holidayDate);
      const blackout = await createBlackout(adminApi, {
        type: 'company_holiday',
        start_date: holidayDate,
        end_date: holidayDate,
        reason: `Current week shutdown ${Date.now()}`,
      });

      const employeeContext = await browser.newContext();
      try {
        await loginInContext(employeeContext, employeeCredentials);

        const page = await employeeContext.newPage();
        await page.goto('/time-tracking');
        await expect(page.locator('app-time-tracking')).toBeVisible();
        const nextWeekButton = page.locator('button').filter({
          has: page.locator('mat-icon', { hasText: 'chevron_right' }),
        }).first();
        const nextWeekBlackoutResponse = page.waitForResponse(response =>
          response.url().includes('/api/blackouts/check') &&
          response.url().includes(`start_date=${weekDates[0]}`) &&
          response.url().includes(`end_date=${weekDates[6]}`) &&
          response.request().method() === 'GET' &&
          response.ok()
        );
        await nextWeekButton.click();
        await nextWeekBlackoutResponse;
        await expect(page.locator('.week-label')).toContainText(weekDates[0]);

        const timeCells = page.locator('app-time-tracking .grid-row.time-row .day-col');
        const bookingCells = page.locator('app-time-tracking .grid-row').filter({
          has: page.locator('.cost-center-label'),
        }).locator('.day-col');

        await expect(timeCells.nth(holidayIndex).locator('.absence-chip')).toContainText('Company Holiday');
        await expect(timeCells.nth(holidayIndex).locator('input.time-input')).toHaveCount(0);
        await expect(bookingCells.nth(holidayIndex).locator('input.pct-input')).toHaveCount(0);
      } finally {
        await employeeContext.close();
        await deleteBlackout(adminApi, blackout.id);
      }
    } finally {
      await deleteUser(adminApi, employee.id);
      await adminApi.dispose();
    }
  });
});
