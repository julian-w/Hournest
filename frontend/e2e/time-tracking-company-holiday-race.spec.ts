import { expect, test } from '@playwright/test';
import { createBlackout, createTimeEntry, deleteBlackout, getHolidays } from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { currentWeekIsoDates } from './helpers/ui';

function isWeekend(isoDate: string): boolean {
  const day = new Date(`${isoDate}T12:00:00`).getDay();
  return day === 0 || day === 6;
}

test.describe('time tracking company holiday race flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the company-holiday race flow.');

  test('employee sees the backend conflict when a company holiday is added after the week was already open', async ({ browser, request }) => {
    expect(await isLocalLoginEnabled(request)).toBeTruthy();

    const employeeCredentials = {
      username: 'e2e.employee@hournest.local',
      password: 'e2e-password',
    };
    const adminCredentials = getConfiguredCredentials();

    const employeeApi = await createLoggedInApiRequestContext({ ...employeeCredentials });
    const adminApi = await createLoggedInApiRequestContext({ ...adminCredentials });

    try {
      const currentYear = new Date().getFullYear();
      const holidays = await getHolidays(adminApi, currentYear);
      const holidayDates = new Set(holidays.map(holiday => holiday.date));
      const nextWeekDates = currentWeekIsoDates(1);
      const targetDate = nextWeekDates.find(date => !isWeekend(date) && !holidayDates.has(date)) ?? nextWeekDates[1];
      const targetIndex = nextWeekDates.indexOf(targetDate);
      const holidayReason = `Race holiday ${Date.now()}`;

      await createTimeEntry(employeeApi, {
        date: targetDate,
        startTime: '08:00',
        endTime: '16:30',
        breakMinutes: 30,
      });

      const employeeContext = await browser.newContext();
      try {
        await loginInContext(employeeContext, employeeCredentials);

        const page = await employeeContext.newPage();
        const snackBar = page.locator('mat-snack-bar-container').last();
        await page.goto('/time-tracking');
        await expect(page.locator('app-time-tracking')).toBeVisible();

        const nextWeekButton = page.locator('button').filter({
          has: page.locator('mat-icon', { hasText: 'chevron_right' }),
        }).first();
        await nextWeekButton.click();
        await expect(page.locator('.week-label')).toContainText(nextWeekDates[0]);

        const bookingRows = page.locator('app-time-tracking .grid-row').filter({
          has: page.locator('.cost-center-label'),
        });
        const firstRowInput = bookingRows.nth(0).locator('.day-col').nth(targetIndex).locator('input.pct-input');
        const secondRowInput = bookingRows.nth(1).locator('.day-col').nth(targetIndex).locator('input.pct-input');

        await expect(firstRowInput).toBeVisible();
        await expect(secondRowInput).toBeVisible();

        const blackout = await createBlackout(adminApi, {
          type: 'company_holiday',
          start_date: targetDate,
          end_date: targetDate,
          reason: holidayReason,
        });

        try {
          await firstRowInput.fill('60');
          await secondRowInput.fill('40');
          await page.getByRole('button', { name: /save all/i }).click();

          await expect(snackBar).toContainText('Cannot book time on a company holiday.');
          await page.reload();
          await expect(page.locator('app-time-tracking')).toBeVisible();
          await nextWeekButton.click();
          await expect(page.locator('.week-label')).toContainText(nextWeekDates[0]);
          await expect(page.locator('app-time-tracking .grid-row.time-row .day-col').nth(targetIndex).locator('.absence-chip')).toContainText('Company Holiday');
        } finally {
          await deleteBlackout(adminApi, blackout.id);
        }
      } finally {
        await employeeContext.close();
      }
    } finally {
      await employeeApi.dispose();
      await adminApi.dispose();
    }
  });
});
