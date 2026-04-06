import { expect, test } from '@playwright/test';
import {
  archiveCostCenter,
  assignUserCostCenters,
  createCostCenter,
  createLocalEmployee,
  createTimeBookings,
  createTimeEntry,
  deleteUser,
  getHolidays,
  getTimeBookings,
  uniqueSuffix,
} from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { currentWeekIsoDates, isWeekendIsoDate } from './helpers/ui';

async function pickNextWeekWorkday(adminApi: import('@playwright/test').APIRequestContext): Promise<string> {
  const nextWeekDates = currentWeekIsoDates(1);
  const years = [...new Set(nextWeekDates.map(date => Number(date.slice(0, 4))))];
  const holidaysByYear = await Promise.all(years.map(year => getHolidays(adminApi, year)));
  const holidayDates = new Set(holidaysByYear.flat().map(holiday => holiday.date));

  return nextWeekDates.find(date => !isWeekendIsoDate(date) && !holidayDates.has(date)) ?? nextWeekDates[1];
}

test.describe('time tracking cost center race flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the time-tracking cost center race flow.');

  test('employee gets a backend conflict when an admin removes the only available cost center during an open week', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();

    const adminApi = await createLoggedInApiRequestContext({ ...adminCredentials });
    const employee = await createLocalEmployee(adminApi, suffix);
    const employeeCredentials = {
      username: employee.email,
      password: employee.password,
    };
    const costCenter = await createCostCenter(adminApi, {
      code: `E2C-${suffix}`.slice(0, 20),
      name: `E2E Cost Center Race ${suffix}`,
      description: 'Generated for cost-center race flow',
    });
    let costCenterArchived = false;

    try {
      await assignUserCostCenters(adminApi, employee.id, [costCenter.id]);

      const employeeApi = await createLoggedInApiRequestContext(employeeCredentials);
      try {
        const targetDate = await pickNextWeekWorkday(adminApi);
        const targetIndex = currentWeekIsoDates(1).indexOf(targetDate);

        await createTimeEntry(employeeApi, {
          date: targetDate,
          startTime: '08:00',
          endTime: '16:00',
          breakMinutes: 30,
        });
        await createTimeBookings(employeeApi, {
          date: targetDate,
          bookings: [{ cost_center_id: costCenter.id, percentage: 100 }],
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
          await expect(page.locator('.week-label')).toContainText(currentWeekIsoDates(1)[0]);

          const bookingRow = page.locator('app-time-tracking .grid-row').filter({
            has: page.locator('.cost-center-label', { hasText: costCenter.name }),
          }).first();
          const bookingInput = bookingRow.locator('.day-col').nth(targetIndex).locator('input.pct-input');
          await expect(bookingInput).toHaveValue('100');

          await archiveCostCenter(adminApi, costCenter.id);
          costCenterArchived = true;

          await page.getByRole('button', { name: /save all/i }).click();
          await expect(snackBar).toContainText(`Cost center ${costCenter.id} is not available to you.`);

          await page.reload();
          await expect(page.locator('app-time-tracking')).toBeVisible();
          const nextWeekButtonAfterReload = page.locator('button').filter({
            has: page.locator('mat-icon', { hasText: 'chevron_right' }),
          }).first();
          await nextWeekButtonAfterReload.click();
          await expect(page.locator('.week-label')).toContainText(currentWeekIsoDates(1)[0]);
          await expect(page.locator('.cost-center-label', { hasText: costCenter.name })).toHaveCount(0);

          const storedBookings = await getTimeBookings(employeeApi, { from: targetDate, to: targetDate });
          const storedTargetBooking = storedBookings.find(booking => booking.cost_center_id === costCenter.id);
          expect(storedTargetBooking?.percentage).toBe(100);
        } finally {
          await employeeContext.close();
        }
      } finally {
        await employeeApi.dispose();
      }
    } finally {
      await deleteUser(adminApi, employee.id);
      if (!costCenterArchived) {
        await archiveCostCenter(adminApi, costCenter.id);
      }
      await adminApi.dispose();
    }
  });
});
