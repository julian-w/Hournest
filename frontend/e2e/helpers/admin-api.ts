import { APIRequestContext, expect } from '@playwright/test';
import { getApiBaseUrl } from './auth';

export interface CreatedUser {
  id: number;
  email: string;
  password: string;
  displayName: string;
}

export interface ListedUser {
  id: number;
  email: string;
  display_name: string;
  role: string;
  vacation_days_per_year: number;
}

export interface CreatedCostCenter {
  id: number;
  code: string;
  name: string;
}

export interface ListedCostCenter {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  is_system: boolean;
}

export interface CreatedUserGroup {
  id: number;
  name: string;
}

export interface ListedUserGroup {
  id: number;
  name: string;
  description?: string | null;
}

export interface CreatedBlackout {
  id: number;
  type: 'freeze' | 'company_holiday';
  start_date: string;
  end_date: string;
  reason: string;
}

export interface ListedHoliday {
  id: number;
  name: string;
  date: string;
}

export interface ListedTimeBooking {
  id: number;
  date: string;
  cost_center_id: number;
  percentage: number;
  comment?: string | null;
}

export interface ListedTimeLock {
  id: number;
  year: number;
  month: number;
}

export function uniqueSuffix(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export async function createLocalEmployee(request: APIRequestContext, suffix = uniqueSuffix()): Promise<CreatedUser> {
  const password = `E2E-pass-${suffix}`;
  const email = `e2e.employee.${suffix}@example.test`;
  const displayName = `E2E Employee ${suffix}`;

  const response = await request.post(`${getApiBaseUrl()}/api/admin/users`, {
    data: {
      display_name: displayName,
      email,
      role: 'employee',
      vacation_days_per_year: 30,
      password,
    },
  });

  if (!response.ok()) {
    throw new Error(`createLocalEmployee failed (${response.status()}): ${await response.text()}`);
  }
  const body = await response.json();

  return {
    id: body.data.id,
    email,
    password,
    displayName,
  };
}

export async function deleteUser(request: APIRequestContext, userId: number): Promise<void> {
  const response = await request.delete(`${getApiBaseUrl()}/api/admin/users/${userId}`);
  expect(response.ok()).toBeTruthy();
}

export async function getUsers(request: APIRequestContext): Promise<ListedUser[]> {
  const response = await request.get(`${getApiBaseUrl()}/api/admin/users`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data;
}

export async function findUserByEmail(request: APIRequestContext, email: string): Promise<ListedUser | undefined> {
  const users = await getUsers(request);
  return users.find(user => user.email === email);
}

export async function getBlackouts(request: APIRequestContext): Promise<CreatedBlackout[]> {
  const response = await request.get(`${getApiBaseUrl()}/api/admin/blackouts`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data;
}

export async function getHolidays(request: APIRequestContext, year: number): Promise<ListedHoliday[]> {
  const response = await request.get(`${getApiBaseUrl()}/api/holidays?year=${year}`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data;
}

export async function getTimeBookings(
  request: APIRequestContext,
  data: { from: string; to: string },
): Promise<ListedTimeBooking[]> {
  const response = await request.get(`${getApiBaseUrl()}/api/time-bookings?from=${data.from}&to=${data.to}`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data;
}

export async function createBlackout(
  request: APIRequestContext,
  data: { type: 'freeze' | 'company_holiday'; start_date: string; end_date: string; reason: string },
): Promise<CreatedBlackout> {
  const response = await request.post(`${getApiBaseUrl()}/api/admin/blackouts`, {
    data,
  });

  if (!response.ok()) {
    throw new Error(`createBlackout failed (${response.status()}): ${await response.text()}`);
  }

  const body = await response.json();
  return body.data;
}

export async function deleteBlackout(request: APIRequestContext, blackoutId: number): Promise<void> {
  const response = await request.delete(`${getApiBaseUrl()}/api/admin/blackouts/${blackoutId}`);
  expect(response.ok()).toBeTruthy();
}

export async function createCostCenter(
  request: APIRequestContext,
  data: { code: string; name: string; description?: string },
): Promise<CreatedCostCenter> {
  const response = await request.post(`${getApiBaseUrl()}/api/admin/cost-centers`, {
    data,
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();

  return {
    id: body.data.id,
    code: body.data.code,
    name: body.data.name,
  };
}

export async function getCostCenters(request: APIRequestContext): Promise<ListedCostCenter[]> {
  const response = await request.get(`${getApiBaseUrl()}/api/admin/cost-centers`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data;
}

export async function findCostCenterByCode(
  request: APIRequestContext,
  code: string,
): Promise<ListedCostCenter | undefined> {
  const costCenters = await getCostCenters(request);
  return costCenters.find(costCenter => costCenter.code === code);
}

export async function archiveCostCenter(request: APIRequestContext, costCenterId: number): Promise<void> {
  const response = await request.delete(`${getApiBaseUrl()}/api/admin/cost-centers/${costCenterId}`);
  expect(response.ok()).toBeTruthy();
}

export async function assignUserCostCenters(
  request: APIRequestContext,
  userId: number,
  costCenterIds: number[],
): Promise<void> {
  const response = await request.put(`${getApiBaseUrl()}/api/admin/users/${userId}/cost-centers`, {
    data: {
      cost_center_ids: costCenterIds,
    },
  });

  expect(response.ok()).toBeTruthy();
}

export async function addFavoriteCostCenter(request: APIRequestContext, costCenterId: number): Promise<void> {
  const response = await request.post(`${getApiBaseUrl()}/api/cost-center-favorites`, {
    data: {
      cost_center_id: costCenterId,
    },
  });

  expect(response.ok()).toBeTruthy();
}

export async function createUserGroup(
  request: APIRequestContext,
  data: { name: string; description?: string },
): Promise<CreatedUserGroup> {
  const response = await request.post(`${getApiBaseUrl()}/api/admin/user-groups`, {
    data,
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();

  return {
    id: body.data.id,
    name: body.data.name,
  };
}

export async function deleteUserGroup(request: APIRequestContext, groupId: number): Promise<void> {
  const response = await request.delete(`${getApiBaseUrl()}/api/admin/user-groups/${groupId}`);
  expect(response.ok()).toBeTruthy();
}

export async function getUserGroups(request: APIRequestContext): Promise<ListedUserGroup[]> {
  const response = await request.get(`${getApiBaseUrl()}/api/admin/user-groups`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data;
}

export async function findUserGroupByName(
  request: APIRequestContext,
  name: string,
): Promise<ListedUserGroup | undefined> {
  const groups = await getUserGroups(request);
  return groups.find(group => group.name === name);
}

export async function setGroupMembers(
  request: APIRequestContext,
  groupId: number,
  userIds: number[],
): Promise<void> {
  const response = await request.put(`${getApiBaseUrl()}/api/admin/user-groups/${groupId}/members`, {
    data: {
      user_ids: userIds,
    },
  });

  expect(response.ok()).toBeTruthy();
}

export async function createVacationRequest(
  request: APIRequestContext,
  data: {
    startDate: string;
    endDate: string;
    scope?: 'full_day' | 'morning' | 'afternoon';
    comment?: string;
  },
): Promise<number> {
  const response = await request.post(`${getApiBaseUrl()}/api/vacations`, {
    data: {
      start_date: data.startDate,
      end_date: data.endDate,
      scope: data.scope ?? 'full_day',
      comment: data.comment,
    },
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data.id;
}

export async function reviewVacationRequest(
  request: APIRequestContext,
  vacationId: number,
  data: { status: 'approved' | 'rejected'; comment?: string },
): Promise<void> {
  const response = await request.patch(`${getApiBaseUrl()}/api/admin/vacations/${vacationId}`, {
    data: {
      status: data.status,
      comment: data.comment,
    },
  });

  expect(response.ok()).toBeTruthy();
}

export async function createAbsenceRequest(
  request: APIRequestContext,
  data: {
    startDate: string;
    endDate: string;
    type: 'illness' | 'special_leave';
    scope?: 'full_day' | 'morning' | 'afternoon';
    comment?: string;
  },
): Promise<number> {
  const response = await request.post(`${getApiBaseUrl()}/api/absences`, {
    data: {
      start_date: data.startDate,
      end_date: data.endDate,
      type: data.type,
      scope: data.scope ?? 'full_day',
      comment: data.comment,
    },
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data.id;
}

export async function createAdminAbsence(
  request: APIRequestContext,
  data: {
    userId: number;
    startDate: string;
    endDate: string;
    type: 'illness' | 'special_leave';
    scope?: 'full_day' | 'morning' | 'afternoon';
    comment?: string;
    adminComment?: string;
  },
): Promise<number> {
  const response = await request.post(`${getApiBaseUrl()}/api/admin/absences`, {
    data: {
      user_id: data.userId,
      start_date: data.startDate,
      end_date: data.endDate,
      type: data.type,
      scope: data.scope ?? 'full_day',
      comment: data.comment,
      admin_comment: data.adminComment,
    },
  });

  if (!response.ok()) {
    throw new Error(`createAdminAbsence failed (${response.status()}): ${await response.text()}`);
  }

  const body = await response.json();
  return body.data.id;
}

export async function deleteAdminAbsence(request: APIRequestContext, absenceId: number): Promise<void> {
  const response = await request.delete(`${getApiBaseUrl()}/api/admin/absences/${absenceId}`);
  expect(response.ok()).toBeTruthy();
}

export async function reviewAbsenceRequest(
  request: APIRequestContext,
  absenceId: number,
  data: { status: 'acknowledged' | 'approved' | 'rejected'; adminComment?: string },
): Promise<void> {
  const response = await request.patch(`${getApiBaseUrl()}/api/admin/absences/${absenceId}`, {
    data: {
      status: data.status,
      admin_comment: data.adminComment,
    },
  });

  expect(response.ok()).toBeTruthy();
}

export async function createTimeEntry(
  request: APIRequestContext,
  data: {
    date: string;
    startTime: string;
    endTime: string;
    breakMinutes?: number;
  },
): Promise<void> {
  const response = await request.put(`${getApiBaseUrl()}/api/time-entries/${data.date}`, {
    data: {
      start_time: data.startTime,
      end_time: data.endTime,
      break_minutes: data.breakMinutes ?? 0,
    },
  });

  if (!response.ok()) {
    throw new Error(`createTimeEntry failed (${response.status()}): ${await response.text()}`);
  }
}

export async function createTimeBookings(
  request: APIRequestContext,
  data: {
    date: string;
    bookings: Array<{
      cost_center_id: number;
      percentage: number;
      comment?: string;
    }>;
  },
): Promise<void> {
  const response = await request.put(`${getApiBaseUrl()}/api/time-bookings/${data.date}`, {
    data: {
      bookings: data.bookings,
    },
  });

  if (!response.ok()) {
    throw new Error(`createTimeBookings failed (${response.status()}): ${await response.text()}`);
  }
}

export async function getTimeLocks(request: APIRequestContext): Promise<ListedTimeLock[]> {
  const response = await request.get(`${getApiBaseUrl()}/api/admin/time-locks`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data;
}

export async function setTimeLock(
  request: APIRequestContext,
  data: { year: number; month: number; locked: boolean },
): Promise<void> {
  const locks = await getTimeLocks(request);
  const alreadyLocked = locks.some(lock => lock.year === data.year && lock.month === data.month);

  if (alreadyLocked === data.locked) {
    return;
  }

  const response = await request.post(`${getApiBaseUrl()}/api/admin/time-locks`, {
    data: {
      year: data.year,
      month: data.month,
    },
  });

  expect(response.ok()).toBeTruthy();
}
