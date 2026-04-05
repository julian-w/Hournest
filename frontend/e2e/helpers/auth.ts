import { expect, BrowserContext, APIRequestContext, Page } from '@playwright/test';

export interface Credentials {
  username: string;
  password: string;
}

export function getApiBaseUrl(): string {
  return process.env.E2E_API_URL ?? 'http://127.0.0.1:8000';
}

export function hasE2ECredentials(): boolean {
  return Boolean(process.env.E2E_USERNAME && process.env.E2E_PASSWORD);
}

export function hasAdminE2ECredentials(): boolean {
  return hasE2ECredentials() && ['admin', 'superadmin'].includes((process.env.E2E_ROLE ?? '').toLowerCase());
}

export function getConfiguredCredentials(): Credentials {
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!username || !password) {
    throw new Error('Missing E2E_USERNAME or E2E_PASSWORD for authenticated Playwright tests.');
  }

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
  const response = await context.request.post(`${getApiBaseUrl()}/api/auth/login`, {
    data: credentials,
  });

  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  if (body?.must_change_password) {
    const newPassword = options?.newPassword ?? `${credentials.password}-changed`;
    const changePasswordResponse = await context.request.post(`${getApiBaseUrl()}/api/auth/change-password`, {
      data: {
        current_password: credentials.password,
        new_password: newPassword,
        new_password_confirmation: newPassword,
      },
    });

    expect(changePasswordResponse.ok()).toBeTruthy();
    credentials.password = newPassword;
  }
}

export async function loginAsConfiguredUser(page: Page): Promise<void> {
  await loginInContext(page.context(), getConfiguredCredentials());
}
