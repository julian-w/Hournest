import { expect, test } from '@playwright/test';
import { createTimeEntry, getHolidays } from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { currentWeekIsoDates } from './helpers/ui';

function isWeekend(isoDate: string): boolean {
  const day = new Date(`${isoDate}T12:00:00`).getDay();
  return day === 0 || day === 6;
}

test.describe('time tracking save flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the time-tracking save flow.');

  test('employee saves weekly bookings in the UI for an existing workday', async ({ browser, request }) => {
    expect(await isLocalLoginEnabled(request)).toBeTruthy();

    const employeeCredentials = {
      username: 'e2e.employee@hournest.local',
      password: 'e2e-password',
    };

    const employeeApi = await createLoggedInApiRequestContext({ ...employeeCredentials });
    const adminApi = await createLoggedInApiRequestContext({ ...getConfiguredCredentials() });

    try {
      const currentYear = new Date().getFullYear();
      const holidays = await getHolidays(adminApi, currentYear);
      const holidayDates = new Set(holidays.map(holiday => holiday.date));
      const nextWeekDates = currentWeekIsoDates(1);
      const targetDate = nextWeekDates.find(date => !isWeekend(date) && !holidayDates.has(date)) ?? nextWeekDates[1];
      const targetIndex = nextWeekDates.indexOf(targetDate);

      await createTimeEntry(employeeApi, {
        date: targetDate,
        startTime: '08:00',
        endTime: '16:30',
        breakMinutes: 30,
      });

      const employeeContext = await browser.newContext();
      try {
        await loginInContext(employeeContext, employeeCredentials);

        const employeePage = await employeeContext.newPage();
        await employeePage.goto('/time-tracking');
        await expect(employeePage.locator('app-time-tracking')).toBeVisible();

        const nextWeekButton = employeePage.locator('button').filter({
          has: employeePage.locator('mat-icon', { hasText: 'chevron_right' }),
        }).first();
        await nextWeekButton.click();
        await expect(employeePage.locator('.week-label')).toContainText(nextWeekDates[0]);

        const bookingRows = employeePage.locator('app-time-tracking .grid-row').filter({
          has: employeePage.locator('.cost-center-label'),
        });
        const firstCostCenterRow = bookingRows.nth(0);
        const secondCostCenterRow = bookingRows.nth(1);
        const targetDayFirstRowInput = firstCostCenterRow.locator('.day-col').nth(targetIndex).locator('input.pct-input');
        const targetDaySecondRowInput = secondCostCenterRow.locator('.day-col').nth(targetIndex).locator('input.pct-input');
        const totalCell = employeePage.locator('app-time-tracking .grid-row.total-row .day-col').nth(targetIndex);
        const timeBookingSaveMatcher = (response: { url(): string; request(): { method(): string }; ok(): boolean }) =>
          response.url().includes(`/api/time-bookings/${targetDate}`) && response.request().method() === 'PUT' && response.ok();

        expect(await bookingRows.count()).toBeGreaterThanOrEqual(2);
        await expect(employeePage.locator('app-time-tracking .grid-row.time-row .day-col').nth(targetIndex).locator('.net-hours')).toContainText('8:00');

        await targetDayFirstRowInput.fill('55');
        await targetDaySecondRowInput.fill('45');
        await expect(totalCell).toContainText('100%');

        const saveButton = employeePage.locator('button').filter({
          has: employeePage.locator('mat-icon', { hasText: 'save' }),
        }).first();

        const bookingSaveResponse = employeePage.waitForResponse(timeBookingSaveMatcher);
        await saveButton.click();
        await bookingSaveResponse;
        await expect(employeePage.locator('mat-snack-bar-container').last()).toContainText(/saved|gespeichert/i);

        await employeePage.reload();
        await expect(employeePage.locator('app-time-tracking')).toBeVisible();
        await nextWeekButton.click();
        await expect(employeePage.locator('.week-label')).toContainText(nextWeekDates[0]);
        await expect(employeePage.locator('app-time-tracking .grid-row').filter({
          has: employeePage.locator('.cost-center-label'),
        }).nth(0).locator('.day-col').nth(targetIndex).locator('input.pct-input')).toHaveValue('55');
        await expect(employeePage.locator('app-time-tracking .grid-row').filter({
          has: employeePage.locator('.cost-center-label'),
        }).nth(1).locator('.day-col').nth(targetIndex).locator('input.pct-input')).toHaveValue('45');
      } finally {
        await employeeContext.close();
      }
    } finally {
      await employeeApi.dispose();
      await adminApi.dispose();
    }
  });
});
