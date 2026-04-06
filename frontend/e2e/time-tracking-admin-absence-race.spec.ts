import { expect, test } from '@playwright/test';
import {
  createAdminAbsence,
  deleteAdminAbsence,
  findUserByEmail,
  uniqueSuffix,
} from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { currentWeekIsoDates } from './helpers/ui';

async function findSeededBookingDayIndex(page: import('@playwright/test').Page): Promise<number> {
  await expect(page.locator('app-time-tracking .net-hours').first()).toBeVisible();

  const timeCells = page.locator('app-time-tracking .grid-row.time-row .day-col');
  const totalCells = await timeCells.count();

  for (let index = 0; index < totalCells; index++) {
    const cellText = (await timeCells.nth(index).textContent()) ?? '';
    if (/\d+:\d{2}/.test(cellText)) {
      return index;
    }
  }

  throw new Error('Could not find a seeded current-week day with recorded hours.');
}

function getWeekDateForIndex(index: number): string {
  const weekDates = currentWeekIsoDates();
  return weekDates[index] ?? weekDates[0];
}

test.describe('time tracking admin absence race flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the admin absence race flow.');

  test('employee sees the backend conflict when an admin-created full-day absence appears after the week was already open', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const employeeComment = `Admin absence race ${suffix}`;
    const seededEmployeeEmail = 'e2e.employee@hournest.local';

    const adminApi = await createLoggedInApiRequestContext({ ...adminCredentials });
    const employee = await findUserByEmail(adminApi, seededEmployeeEmail);
    const employeeCredentials = {
      username: seededEmployeeEmail,
      password: 'e2e-password',
    };
    if (!employee) {
      throw new Error(`Seeded employee ${seededEmployeeEmail} not found.`);
    }
    let createdAbsenceId: number | null = null;

    try {
      const employeeContext = await browser.newContext();
      try {
        await loginInContext(employeeContext, employeeCredentials);

        const page = await employeeContext.newPage();
        const snackBar = page.locator('mat-snack-bar-container').last();
        await page.goto('/time-tracking');
        await expect(page.locator('app-time-tracking')).toBeVisible();

        const targetIndex = await findSeededBookingDayIndex(page);
        const targetDate = getWeekDateForIndex(targetIndex);
        const bookingRows = page.locator('app-time-tracking .grid-row').filter({
          has: page.locator('.cost-center-label'),
        });
        const firstRowInput = bookingRows.nth(0).locator('.day-col').nth(targetIndex).locator('input.pct-input');
        const secondRowInput = bookingRows.nth(1).locator('.day-col').nth(targetIndex).locator('input.pct-input');

        await expect(firstRowInput).toBeVisible();
        await expect(secondRowInput).toBeVisible();

        createdAbsenceId = await createAdminAbsence(adminApi, {
          userId: employee.id,
          startDate: targetDate,
          endDate: targetDate,
          type: 'special_leave',
          scope: 'full_day',
          comment: employeeComment,
          adminComment: 'Created during employee session',
        });

        await firstRowInput.fill('50');
        await secondRowInput.fill('50');
        await page.getByRole('button', { name: /save all/i }).click();

        await expect(snackBar).toContainText('Cannot book time on a day with a full-day absence.');
        await page.reload();
        await expect(page.locator('app-time-tracking')).toBeVisible();
        await expect(page.locator('app-time-tracking .grid-row.time-row .day-col').nth(targetIndex).locator('.absence-chip')).toContainText('Special Leave');
      } finally {
        await employeeContext.close();
      }
    } finally {
      if (createdAbsenceId !== null) {
        await deleteAdminAbsence(adminApi, createdAbsenceId);
      }
      await adminApi.dispose();
    }
  });
});
