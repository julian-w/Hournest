import { expect, test } from '@playwright/test';
import {
  addFavoriteCostCenter,
  archiveCostCenter,
  assignUserCostCenters,
  createCostCenter,
  createLocalEmployee,
  deleteUser,
  uniqueSuffix,
} from './helpers/admin-api';
import { getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';

test.describe('time tracking favorites flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the time-tracking favorites flow.');

  test('favorite cost centers appear first in the weekly booking grid', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();

    const adminContext = await browser.newContext();
    await loginInContext(adminContext, adminCredentials);

    const employee = await createLocalEmployee(adminContext.request, suffix);
    const standardCostCenter = await createCostCenter(adminContext.request, {
      code: `E2E-A-${suffix}`.slice(0, 20),
      name: `E2E Standard ${suffix}`,
      description: 'Regular cost center for E2E ordering coverage',
    });
    const favoriteCostCenter = await createCostCenter(adminContext.request, {
      code: `E2E-B-${suffix}`.slice(0, 20),
      name: `E2E Favorite ${suffix}`,
      description: 'Favorite cost center for E2E ordering coverage',
    });

    try {
      await assignUserCostCenters(adminContext.request, employee.id, [standardCostCenter.id, favoriteCostCenter.id]);

      const employeeContext = await browser.newContext();
      try {
        await loginInContext(employeeContext, {
          username: employee.email,
          password: employee.password,
        });

        await addFavoriteCostCenter(employeeContext.request, favoriteCostCenter.id);

        const employeePage = await employeeContext.newPage();
        await employeePage.goto('/time-tracking');
        await expect(employeePage.locator('app-time-tracking')).toBeVisible();

        const firstFavoriteName = employeePage.locator('.grid-row.favorite-row .cost-center-label .cc-name').first();
        await expect(firstFavoriteName).toHaveText(favoriteCostCenter.name);
        await expect(employeePage.locator('.grid-row.favorite-row .fav-icon').first()).toBeVisible();
        await expect(employeePage.locator('.grid-row .cost-center-label .cc-name').filter({ hasText: standardCostCenter.name }).first()).toBeVisible();
      } finally {
        await employeeContext.close();
      }
    } finally {
      await archiveCostCenter(adminContext.request, favoriteCostCenter.id);
      await archiveCostCenter(adminContext.request, standardCostCenter.id);
      await deleteUser(adminContext.request, employee.id);
      await adminContext.close();
    }
  });
});
