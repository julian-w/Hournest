import { expect, request as playwrightRequest, BrowserContext, APIRequestContext, Page } from '@playwright/test';

const defaultCredentials: Credentials = {
  username: 'superadmin',
  password: 'e2e-password',
};

export interface Credentials {
  username: string;
  password: string;
}

export function getApiBaseUrl(): string {
  return process.env.E2E_API_URL ?? 'http://127.0.0.1:8000';
}

export function getFrontendBaseUrl(): string {
  return process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4200';
}

export function hasE2ECredentials(): boolean {
  return Boolean(getConfiguredCredentials().username && getConfiguredCredentials().password);
}

export function hasAdminE2ECredentials(): boolean {
  return hasE2ECredentials() && ['admin', 'superadmin'].includes((process.env.E2E_ROLE ?? 'superadmin').toLowerCase());
}

export function getConfiguredCredentials(): Credentials {
  const username = process.env.E2E_USERNAME ?? defaultCredentials.username;
  const password = process.env.E2E_PASSWORD ?? defaultCredentials.password;

  return { username, password };
}

export async function isLocalLoginEnabled(request: APIRequestContext): Promise<boolean> {
  const response = await request.get(`${getApiBaseUrl()}/api/auth/config`);
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  return body?.data?.oauth_enabled === false;
}

export async function loginInContext(
  context: BrowserContext,
  credentials: Credentials,
  options?: { newPassword?: string },
): Promise<void> {
  const page = await context.newPage();
  try {
    await loginOnPage(page, credentials, options);
  } finally {
    await page.close();
  }
}

export async function loginAsConfiguredUser(page: Page): Promise<void> {
  await loginOnPage(page, getConfiguredCredentials());
}

export async function createAuthenticatedRequestContext(context: BrowserContext): Promise<APIRequestContext> {
  const frontendBaseUrl = getFrontendBaseUrl();
  const storageState = await context.storageState();
  const xsrfToken = storageState.cookies.find(cookie => cookie.name === 'XSRF-TOKEN')?.value;
  return playwrightRequest.newContext({
    baseURL: getApiBaseUrl(),
    extraHTTPHeaders: {
      Accept: 'application/json',
      Origin: frontendBaseUrl,
      Referer: `${frontendBaseUrl}/`,
      'X-Requested-With': 'XMLHttpRequest',
      ...(xsrfToken ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfToken) } : {}),
    },
    storageState,
  });
}

export async function createLoggedInApiRequestContext(
  credentials: Credentials,
  options?: { newPassword?: string },
): Promise<APIRequestContext> {
  const frontendBaseUrl = getFrontendBaseUrl();
  const bootstrapContext = await playwrightRequest.newContext({
    baseURL: getApiBaseUrl(),
    extraHTTPHeaders: {
      Accept: 'application/json',
      Origin: frontendBaseUrl,
      Referer: `${frontendBaseUrl}/`,
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
  await bootstrapContext.get('/sanctum/csrf-cookie');

  const bootstrapState = await bootstrapContext.storageState();
  const xsrfToken = bootstrapState.cookies.find(cookie => cookie.name === 'XSRF-TOKEN')?.value;
  let apiContext = await playwrightRequest.newContext({
    baseURL: getApiBaseUrl(),
    storageState: bootstrapState,
    extraHTTPHeaders: {
      Accept: 'application/json',
      Origin: frontendBaseUrl,
      Referer: `${frontendBaseUrl}/`,
      'X-Requested-With': 'XMLHttpRequest',
      ...(xsrfToken ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfToken) } : {}),
    },
  });
  await bootstrapContext.dispose();

  const response = await apiContext.post('/api/auth/login', {
    data: credentials,
  });

  if (!response.ok()) {
    throw new Error(`createLoggedInApiRequestContext login failed (${response.status()}): ${await response.text()}`);
  }

  const body = await response.json();
  if (body?.must_change_password) {
    const passwordChangeState = await apiContext.storageState();
    const passwordChangeXsrfToken = passwordChangeState.cookies.find(cookie => cookie.name === 'XSRF-TOKEN')?.value;
    const passwordChangeContext = await playwrightRequest.newContext({
      baseURL: getApiBaseUrl(),
      storageState: passwordChangeState,
      extraHTTPHeaders: {
        Accept: 'application/json',
        Origin: frontendBaseUrl,
        Referer: `${frontendBaseUrl}/`,
        'X-Requested-With': 'XMLHttpRequest',
        ...(passwordChangeXsrfToken ? { 'X-XSRF-TOKEN': decodeURIComponent(passwordChangeXsrfToken) } : {}),
      },
    });
    await apiContext.dispose();
    apiContext = passwordChangeContext;

    const newPassword = options?.newPassword ?? `${credentials.password}-changed`;
    const changePasswordResponse = await apiContext.post('/api/auth/change-password', {
      data: {
        current_password: credentials.password,
        new_password: newPassword,
        new_password_confirmation: newPassword,
      },
    });

    if (!changePasswordResponse.ok()) {
      throw new Error(`createLoggedInApiRequestContext change-password failed (${changePasswordResponse.status()}): ${await changePasswordResponse.text()}`);
    }
    credentials.password = newPassword;
  }

  const authenticatedState = await apiContext.storageState();
  const authenticatedXsrfToken = authenticatedState.cookies.find(cookie => cookie.name === 'XSRF-TOKEN')?.value;
  const refreshedApiContext = await playwrightRequest.newContext({
    baseURL: getApiBaseUrl(),
    storageState: authenticatedState,
    extraHTTPHeaders: {
      Accept: 'application/json',
      Origin: frontendBaseUrl,
      Referer: `${frontendBaseUrl}/`,
      'X-Requested-With': 'XMLHttpRequest',
      ...(authenticatedXsrfToken ? { 'X-XSRF-TOKEN': decodeURIComponent(authenticatedXsrfToken) } : {}),
    },
  });
  await apiContext.dispose();
  apiContext = refreshedApiContext;

  return apiContext;
}

async function loginOnPage(
  page: Page,
  credentials: Credentials,
  options?: { newPassword?: string },
): Promise<void> {
  await page.goto(`${getFrontendBaseUrl()}/login`, { waitUntil: 'domcontentloaded' });

  if (/\/dashboard$/.test(page.url())) {
    return;
  }

  const usernameInput = page.getByLabel(/email|username/i);
  const passwordInput = page.getByLabel(/password/i).first();

  await expect(usernameInput).toBeVisible({ timeout: 10000 });
  await usernameInput.fill(credentials.username);
  await passwordInput.fill(credentials.password);
  await page.getByRole('button', { name: /sign in|login/i }).click();

  const forcedPasswordDialog = page.locator('mat-dialog-container');
  if (await forcedPasswordDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
    const newPassword = options?.newPassword ?? `${credentials.password}-changed`;
    await forcedPasswordDialog.getByLabel(/current/i).fill(credentials.password);
    await forcedPasswordDialog.getByLabel(/^new$/i).fill(newPassword);
    await forcedPasswordDialog.getByLabel(/confirm/i).fill(newPassword);
    await forcedPasswordDialog.getByRole('button', { name: /change/i }).click();
    credentials.password = newPassword;
  }

  await expect(page).toHaveURL(/\/dashboard$/);
}
