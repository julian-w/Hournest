import { expect, test } from '@playwright/test';
import {
  archiveCostCenter,
  assignUserCostCenters,
  createCostCenter,
  createLocalEmployee,
  createTimeBookings,
  createTimeEntry,
  deleteUser,
  uniqueSuffix,
} from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { currentWeekIsoDates, fillDateInput } from './helpers/ui';

function pickCurrentWeekBusinessDate(): string {
  const todayIso = new Date().toISOString().split('T')[0];
  const weekDates = currentWeekIsoDates();

  return weekDates.find(date => date > todayIso && !isWeekend(date))
    ?? weekDates.find(date => date >= todayIso && !isWeekend(date))
    ?? weekDates[0];
}

function isWeekend(isoDate: string): boolean {
  const day = new Date(`${isoDate}T12:00:00`).getDay();
  return day === 0 || day === 6;
}

test.describe('time tracking half-day vacation flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the half-day vacation flow.');

  test('employee requests a half-day vacation, admin approves it, and the time-tracking UI reduces the day to 50 percent', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const targetDate = pickCurrentWeekBusinessDate();
    const weekDates = currentWeekIsoDates();
    const targetDayIndex = weekDates.indexOf(targetDate);
    const employeeComment = `E2E half-day ${suffix}`;
    const adminComment = `Half-day approved ${suffix}`;

    const adminContext = await browser.newContext();
    await loginInContext(adminContext, adminCredentials);
    const adminApi = await createLoggedInApiRequestContext({ ...adminCredentials });
    const employee = await createLocalEmployee(adminApi, suffix);
    const employeeCredentials = {
      username: employee.email,
      password: employee.password,
    };
    const costCenterA = await createCostCenter(adminApi, {
      code: `E2EHDA-${suffix}`,
      name: `E2E Half Day A ${suffix}`,
    });
    const costCenterB = await createCostCenter(adminApi, {
      code: `E2EHDB-${suffix}`,
      name: `E2E Half Day B ${suffix}`,
    });

    await assignUserCostCenters(adminApi, employee.id, [costCenterA.id, costCenterB.id]);

    try {
      const employeeContext = await browser.newContext();
      try {
        const employeeApi = await createLoggedInApiRequestContext(employeeCredentials);

        try {
          await loginInContext(employeeContext, employeeCredentials);
          const employeePage = await employeeContext.newPage();
          await employeePage.goto('/my-vacations');
          await expect(employeePage.locator('app-my-vacations')).toBeVisible();

        await employeePage.getByRole('button').filter({
          has: employeePage.locator('mat-icon', { hasText: 'add' }),
        }).first().click();

        const dialog = employeePage.locator('mat-dialog-container app-vacation-dialog');
        await expect(dialog).toBeVisible();
        await fillDateInput(dialog.locator('input[formcontrolname="startDate"]'), targetDate);
        await fillDateInput(dialog.locator('input[formcontrolname="endDate"]'), targetDate);
        await dialog.locator('mat-select[formcontrolname="scope"]').click();
        await employeePage.locator('mat-option[value="morning"]').click();
        await dialog.locator('textarea[formcontrolname="comment"]').fill(employeeComment);
        await dialog.getByRole('button', { name: /submit|beantragen/i }).click();
        await expect(employeePage.locator('mat-dialog-container')).toHaveCount(0);

        const pendingVacationRow = employeePage.locator('tr.mat-mdc-row').filter({ hasText: employeeComment }).first();
        await expect(pendingVacationRow).toBeVisible();
        await expect(pendingVacationRow).toContainText(/morning|vormittag/i);
        await expect(pendingVacationRow).toContainText('0.5');
        await expect(pendingVacationRow).toContainText(/pending|ausstehend|offen/i);

        const adminPage = await adminContext.newPage();
        await adminPage.goto('/admin/requests');
        await expect(adminPage.locator('app-admin-requests')).toBeVisible();

        const pendingAdminRow = adminPage.locator('tr.mat-mdc-row').filter({ hasText: employee.displayName }).filter({ hasText: '0.5' }).first();
        await expect(pendingAdminRow).toBeVisible();
        await pendingAdminRow.locator('input[matinput]').fill(adminComment);
        await pendingAdminRow.locator('button[color="primary"]').click();
        await expect(pendingAdminRow).toHaveCount(0);

        await employeePage.goto('/my-vacations');
        const approvedVacationRow = employeePage.locator('tr.mat-mdc-row').filter({ hasText: adminComment }).first();
        await expect(approvedVacationRow).toBeVisible();
        await expect(approvedVacationRow).toContainText(/morning|vormittag/i);
        await expect(approvedVacationRow).toContainText('0.5');
        await expect(approvedVacationRow).toContainText(/approved|genehmigt/i);

          await createTimeEntry(employeeApi, {
            date: targetDate,
            startTime: '13:00',
            endTime: '17:30',
            breakMinutes: 30,
          });

        await employeePage.goto('/time-tracking');
        await expect(employeePage.locator('app-time-tracking')).toBeVisible();

        const projectRow = employeePage.locator('.grid-row').filter({ hasText: costCenterA.name }).first();
        const internalRow = employeePage.locator('.grid-row').filter({ hasText: costCenterB.name }).first();
        const totalRow = employeePage.locator('app-time-tracking .grid-row.total-row');
        const timeRow = employeePage.locator('app-time-tracking .grid-row.time-row');

        await expect(timeRow.locator('.day-col').nth(targetDayIndex)).toContainText('4:00');
        await expect(totalRow.locator('.day-col').nth(targetDayIndex)).toContainText('0%');

          await createTimeBookings(employeeApi, {
            date: targetDate,
            bookings: [
              { cost_center_id: costCenterA.id, percentage: 30 },
              { cost_center_id: costCenterB.id, percentage: 20 },
            ],
          });
          await employeePage.reload();
          await expect(employeePage.locator('app-time-tracking')).toBeVisible();

          await expect(projectRow.locator('.day-col').nth(targetDayIndex).locator('input.pct-input')).toHaveValue('30');
          await expect(internalRow.locator('.day-col').nth(targetDayIndex).locator('input.pct-input')).toHaveValue('20');
          await expect(totalRow.locator('.day-col').nth(targetDayIndex)).toContainText('50%');
        } finally {
          await employeeApi.dispose();
        }
      } finally {
        await employeeContext.close();
      }
    } finally {
      await archiveCostCenter(adminApi, costCenterA.id);
      await archiveCostCenter(adminApi, costCenterB.id);
      await deleteUser(adminApi, employee.id);
      await adminApi.dispose();
      await adminContext.close();
    }
  });
});
