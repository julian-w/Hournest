import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { inject } from '@angular/core';
import { MockService } from './mock.service';
import {
  MOCK_USERS,
  MOCK_VACATIONS,
  MOCK_HOLIDAYS,
  MOCK_VARIABLE_DATES,
  MOCK_SETTINGS,
  MOCK_WORK_SCHEDULES,
  getMockLedgerEntries,
} from './mock-data';
import { Vacation } from '../models/vacation.model';
import { Holiday, HolidayInstance } from '../models/holiday.model';
import { WorkSchedule } from '../models/work-schedule.model';
import { VacationLedgerEntry } from '../models/vacation-ledger-entry.model';
import { AppSetting } from '../models/setting.model';
import { User } from '../models/user.model';
import { BlackoutPeriod } from '../models/blackout-period.model';

const MOCK_DELAY = 200;

// Mutable state copies
let vacations: Vacation[] = structuredClone(MOCK_VACATIONS);
let holidays: Holiday[] = structuredClone(MOCK_HOLIDAYS);
let variableDates: Record<number, Record<number, string>> = structuredClone(MOCK_VARIABLE_DATES);
let settings: AppSetting[] = structuredClone(MOCK_SETTINGS);
let workSchedules: WorkSchedule[] = structuredClone(MOCK_WORK_SCHEDULES);
let users: User[] = structuredClone(MOCK_USERS);
let ledgerEntries: VacationLedgerEntry[] = [];
let nextVacationId = 100;
let nextHolidayId = 100;
let nextWorkScheduleId = 100;
let nextLedgerId = 10000;
let nextBlackoutId = 100;
let blackouts: BlackoutPeriod[] = [
  { id: 1, type: 'company_holiday', start_date: '2026-12-21', end_date: '2026-12-31', reason: 'Betriebsferien', created_at: '2026-01-15T00:00:00+00:00' },
  { id: 2, type: 'freeze', start_date: '2026-11-15', end_date: '2026-11-30', reason: 'Inventur', created_at: '2026-01-15T00:00:00+00:00' },
];

function jsonResponse<T>(body: T, status = 200): HttpResponse<T> {
  return new HttpResponse<T>({ status, body });
}

function extractIdFromUrl(url: string, pattern: RegExp): number | null {
  const match = url.match(pattern);
  return match ? parseInt(match[1], 10) : null;
}

function parseBody<T>(req: { body: unknown }): T {
  return req.body as T;
}

function getHolidayInstancesForYear(year: number): HolidayInstance[] {
  return holidays
    .filter(h => h.start_year <= year && (h.end_year === null || h.end_year >= year))
    .map(h => {
      if (h.type === 'fixed') {
        // Fixed holidays: same month/day every year
        const monthDay = h.date.substring(5); // e.g. "01-01"
        return {
          holiday_id: h.id,
          name: h.name,
          type: h.type,
          year,
          date: `${year}-${monthDay}`,
          confirmed: true,
        };
      } else {
        // Variable holidays: check if date has been set for this year
        const dateForYear = variableDates[h.id]?.[year] || null;
        return {
          holiday_id: h.id,
          name: h.name,
          type: h.type,
          year,
          date: dateForYear,
          confirmed: dateForYear !== null,
        };
      }
    });
}

function isYearFullyConfirmed(year: number): boolean {
  const instances = getHolidayInstancesForYear(year);
  return instances.length > 0 && instances.every(i => i.confirmed);
}

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  const mockService = inject(MockService);
  if (!mockService.isActive()) {
    return next(req);
  }

  const url = req.url;
  const method = req.method;

  // Skip non-API requests (e.g., i18n JSON files)
  if (!url.includes('/api/')) {
    return next(req);
  }

  // GET /api/user
  if (method === 'GET' && url.endsWith('/api/user')) {
    return of(jsonResponse({ data: mockService.currentUser() })).pipe(delay(MOCK_DELAY));
  }

  // POST /api/auth/login
  if (method === 'POST' && url.endsWith('/api/auth/login')) {
    return of(jsonResponse({ data: mockService.currentUser() })).pipe(delay(MOCK_DELAY));
  }

  // POST /api/auth/logout
  if (method === 'POST' && url.endsWith('/api/auth/logout')) {
    return of(jsonResponse({ message: 'Logged out' })).pipe(delay(MOCK_DELAY));
  }

  // GET /api/vacations/mine
  if (method === 'GET' && url.endsWith('/api/vacations/mine')) {
    const userId = mockService.currentUser().id;
    const mine = vacations.filter(v => v.user_id === userId);
    return of(jsonResponse({ data: mine })).pipe(delay(MOCK_DELAY));
  }

  // GET /api/vacations
  if (method === 'GET' && url.endsWith('/api/vacations')) {
    const role = mockService.currentUser().role;
    const userId = mockService.currentUser().id;
    const result = (role === 'admin' || role === 'superadmin')
      ? vacations.filter(v => v.status === 'approved')
      : vacations.filter(v => v.status === 'approved' && v.user_id === userId);
    return of(jsonResponse({ data: result })).pipe(delay(MOCK_DELAY));
  }

  // POST /api/vacations
  if (method === 'POST' && url.endsWith('/api/vacations')) {
    const body = parseBody<{ start_date: string; end_date: string; comment: string | null }>(req);
    const vacYear = parseInt(body.start_date.substring(0, 4), 10);

    // Check if holidays are confirmed for the vacation year
    if (!isYearFullyConfirmed(vacYear)) {
      return of(jsonResponse(
        { message: 'Holidays not confirmed for this year', errors: { year: ['holidays_incomplete'] } },
        422
      )).pipe(delay(MOCK_DELAY));
    }

    const user = mockService.currentUser();
    const newVacation: Vacation = {
      id: nextVacationId++,
      user_id: user.id,
      user_name: user.display_name,
      start_date: body.start_date,
      end_date: body.end_date,
      workdays: 5,
      status: 'pending',
      comment: body.comment,
      reviewed_by: null,
      reviewer_name: undefined,
      reviewed_at: null,
      created_at: new Date().toISOString(),
    };
    vacations.push(newVacation);
    return of(jsonResponse({ data: newVacation, message: 'Vacation request created' }, 201)).pipe(delay(MOCK_DELAY));
  }

  // DELETE /api/vacations/:id
  const deleteVacationId = extractIdFromUrl(url, /\/api\/vacations\/(\d+)$/);
  if (method === 'DELETE' && deleteVacationId !== null && !url.includes('/admin/')) {
    vacations = vacations.filter(v => v.id !== deleteVacationId);
    return of(jsonResponse(null, 200)).pipe(delay(MOCK_DELAY));
  }

  // GET /api/vacation-ledger
  if (method === 'GET' && url.includes('/api/vacation-ledger') && !url.includes('/admin/')) {
    const userId = mockService.currentUser().id;
    const yearParam = new URL(url, 'http://localhost').searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    const userLedger = ledgerEntries.filter(e => e.user_id === userId && e.year === year);
    const defaultEntries = getMockLedgerEntries(userId, year);
    const combined = [...defaultEntries, ...userLedger];
    return of(jsonResponse({ data: combined })).pipe(delay(MOCK_DELAY));
  }

  // GET /api/holidays/year-status/:year
  const yearStatusMatch = url.match(/\/api\/holidays\/year-status\/(\d+)$/);
  if (method === 'GET' && yearStatusMatch) {
    const year = parseInt(yearStatusMatch[1], 10);
    return of(jsonResponse({ data: { confirmed: isYearFullyConfirmed(year) } })).pipe(delay(MOCK_DELAY));
  }

  // GET /api/holidays
  if (method === 'GET' && url.includes('/api/holidays') && !url.includes('/admin/') && !url.includes('/year-status/')) {
    const yearParam = new URL(url, 'http://localhost').searchParams.get('year');
    if (yearParam) {
      const year = parseInt(yearParam, 10);
      // Return holiday instances for the specific year
      const instances = getHolidayInstancesForYear(year);
      const holidaysForYear = instances.map(i => ({
        id: i.holiday_id,
        name: i.name,
        date: i.date || '',
        type: i.type,
        start_year: holidays.find(h => h.id === i.holiday_id)!.start_year,
        end_year: holidays.find(h => h.id === i.holiday_id)!.end_year,
      }));
      return of(jsonResponse({ data: holidaysForYear })).pipe(delay(MOCK_DELAY));
    }
    return of(jsonResponse({ data: holidays })).pipe(delay(MOCK_DELAY));
  }

  // GET /api/admin/holidays/year/:year
  const holidayYearMatch = url.match(/\/api\/admin\/holidays\/year\/(\d+)$/);
  if (method === 'GET' && holidayYearMatch) {
    const year = parseInt(holidayYearMatch[1], 10);
    const instances = getHolidayInstancesForYear(year);
    return of(jsonResponse({ data: instances })).pipe(delay(MOCK_DELAY));
  }

  // PATCH /api/admin/holidays/:id/year/:year (set variable holiday date for a year)
  const holidayYearPatchMatch = url.match(/\/api\/admin\/holidays\/(\d+)\/year\/(\d+)$/);
  if (method === 'PATCH' && holidayYearPatchMatch) {
    const holidayId = parseInt(holidayYearPatchMatch[1], 10);
    const year = parseInt(holidayYearPatchMatch[2], 10);
    const body = parseBody<{ date: string }>(req);
    if (!variableDates[holidayId]) {
      variableDates[holidayId] = {};
    }
    variableDates[holidayId][year] = body.date;
    const instance: HolidayInstance = {
      holiday_id: holidayId,
      name: holidays.find(h => h.id === holidayId)?.name || '',
      type: 'variable',
      year,
      date: body.date,
      confirmed: true,
    };
    return of(jsonResponse({ data: instance, message: 'Holiday date updated' })).pipe(delay(MOCK_DELAY));
  }

  // GET /api/admin/settings
  if (method === 'GET' && url.endsWith('/api/admin/settings')) {
    return of(jsonResponse({ data: settings })).pipe(delay(MOCK_DELAY));
  }

  // GET /api/settings
  if (method === 'GET' && url.endsWith('/api/settings')) {
    return of(jsonResponse({ data: settings })).pipe(delay(MOCK_DELAY));
  }

  // PUT /api/admin/settings
  if (method === 'PUT' && url.endsWith('/api/admin/settings')) {
    const body = parseBody<{ settings: Record<string, string> }>(req);
    Object.entries(body.settings).forEach(([key, value]) => {
      const existing = settings.find(s => s.key === key);
      if (existing) {
        existing.value = value;
      } else {
        settings.push({ key, value });
      }
    });
    return of(jsonResponse({ message: 'Settings updated' })).pipe(delay(MOCK_DELAY));
  }

  // GET /api/admin/vacations/pending
  if (method === 'GET' && url.endsWith('/api/admin/vacations/pending')) {
    const pending = vacations.filter(v => v.status === 'pending');
    return of(jsonResponse({ data: pending })).pipe(delay(MOCK_DELAY));
  }

  // PATCH /api/admin/vacations/:id
  const patchVacationId = extractIdFromUrl(url, /\/api\/admin\/vacations\/(\d+)$/);
  if (method === 'PATCH' && patchVacationId !== null) {
    const body = parseBody<{ status: 'approved' | 'rejected'; comment: string | null }>(req);
    const vacation = vacations.find(v => v.id === patchVacationId);
    if (vacation) {
      vacation.status = body.status;
      if (body.comment) {
        vacation.comment = body.comment;
      }
      vacation.reviewed_by = mockService.currentUser().id;
      vacation.reviewer_name = mockService.currentUser().display_name;
      vacation.reviewed_at = new Date().toISOString();
      return of(jsonResponse({ data: vacation, message: `Vacation ${body.status}` })).pipe(delay(MOCK_DELAY));
    }
    return of(jsonResponse({ message: 'Not found' }, 404)).pipe(delay(MOCK_DELAY));
  }

  // GET /api/admin/users
  if (method === 'GET' && url.endsWith('/api/admin/users')) {
    return of(jsonResponse({ data: users })).pipe(delay(MOCK_DELAY));
  }

  // PATCH /api/admin/users/:id
  const patchUserId = extractIdFromUrl(url, /\/api\/admin\/users\/(\d+)$/);
  if (method === 'PATCH' && patchUserId !== null && !url.includes('work-schedules') && !url.includes('vacation-ledger')) {
    const body = parseBody<Partial<User>>(req);
    const user = users.find(u => u.id === patchUserId);
    if (user) {
      Object.assign(user, body);
      return of(jsonResponse({ data: user, message: 'User updated' })).pipe(delay(MOCK_DELAY));
    }
    return of(jsonResponse({ message: 'Not found' }, 404)).pipe(delay(MOCK_DELAY));
  }

  // POST /api/admin/holidays
  if (method === 'POST' && url.endsWith('/api/admin/holidays')) {
    const body = parseBody<{ name: string; date: string; type: 'fixed' | 'variable'; start_year: number; end_year?: number | null }>(req);
    const newHoliday: Holiday = {
      id: nextHolidayId++,
      name: body.name,
      date: body.date,
      type: body.type,
      start_year: body.start_year,
      end_year: body.end_year ?? null,
    };
    holidays.push(newHoliday);
    if (body.type === 'variable' && body.date) {
      const year = parseInt(body.date.substring(0, 4), 10);
      if (!variableDates[newHoliday.id]) {
        variableDates[newHoliday.id] = {};
      }
      variableDates[newHoliday.id][year] = body.date;
    }
    return of(jsonResponse({ data: newHoliday, message: 'Holiday created' }, 201)).pipe(delay(MOCK_DELAY));
  }

  // PATCH /api/admin/holidays/:id (but not /year/)
  const patchHolidayId = extractIdFromUrl(url, /\/api\/admin\/holidays\/(\d+)$/);
  if (method === 'PATCH' && patchHolidayId !== null && !url.includes('/year/')) {
    const body = parseBody<{ name: string; date: string; type: 'fixed' | 'variable'; start_year: number; end_year?: number | null }>(req);
    const holiday = holidays.find(h => h.id === patchHolidayId);
    if (holiday) {
      holiday.name = body.name;
      holiday.date = body.date;
      holiday.type = body.type;
      holiday.start_year = body.start_year;
      holiday.end_year = body.end_year ?? null;
      return of(jsonResponse({ data: holiday, message: 'Holiday updated' })).pipe(delay(MOCK_DELAY));
    }
    return of(jsonResponse({ message: 'Not found' }, 404)).pipe(delay(MOCK_DELAY));
  }

  // DELETE /api/admin/holidays/:id
  const deleteHolidayId = extractIdFromUrl(url, /\/api\/admin\/holidays\/(\d+)$/);
  if (method === 'DELETE' && deleteHolidayId !== null) {
    holidays = holidays.filter(h => h.id !== deleteHolidayId);
    delete variableDates[deleteHolidayId];
    return of(jsonResponse(null, 200)).pipe(delay(MOCK_DELAY));
  }

  // GET /api/admin/users/:id/work-schedules
  const workScheduleUserId = extractIdFromUrl(url, /\/api\/admin\/users\/(\d+)\/work-schedules$/);
  if (method === 'GET' && workScheduleUserId !== null) {
    const userSchedules = workSchedules.filter(ws => ws.user_id === workScheduleUserId);
    return of(jsonResponse({ data: userSchedules })).pipe(delay(MOCK_DELAY));
  }

  // POST /api/admin/users/:id/work-schedules
  if (method === 'POST' && workScheduleUserId !== null) {
    const body = parseBody<{ start_date: string; end_date: string | null; work_days: number[] }>(req);
    const newSchedule: WorkSchedule = {
      id: nextWorkScheduleId++,
      user_id: workScheduleUserId,
      start_date: body.start_date,
      end_date: body.end_date,
      work_days: body.work_days,
    };
    workSchedules.push(newSchedule);
    return of(jsonResponse({ data: newSchedule, message: 'Work schedule created' }, 201)).pipe(delay(MOCK_DELAY));
  }

  // PATCH /api/admin/work-schedules/:id
  const patchWorkScheduleId = extractIdFromUrl(url, /\/api\/admin\/work-schedules\/(\d+)$/);
  if (method === 'PATCH' && patchWorkScheduleId !== null) {
    const body = parseBody<{ start_date: string; end_date: string | null; work_days: number[] }>(req);
    const schedule = workSchedules.find(ws => ws.id === patchWorkScheduleId);
    if (schedule) {
      schedule.start_date = body.start_date;
      schedule.end_date = body.end_date;
      schedule.work_days = body.work_days;
      return of(jsonResponse({ data: schedule, message: 'Work schedule updated' })).pipe(delay(MOCK_DELAY));
    }
    return of(jsonResponse({ message: 'Not found' }, 404)).pipe(delay(MOCK_DELAY));
  }

  // DELETE /api/admin/work-schedules/:id
  const deleteWorkScheduleId = extractIdFromUrl(url, /\/api\/admin\/work-schedules\/(\d+)$/);
  if (method === 'DELETE' && deleteWorkScheduleId !== null) {
    workSchedules = workSchedules.filter(ws => ws.id !== deleteWorkScheduleId);
    return of(jsonResponse(null, 200)).pipe(delay(MOCK_DELAY));
  }

  // GET /api/admin/users/:id/vacation-ledger
  const ledgerUserId = extractIdFromUrl(url, /\/api\/admin\/users\/(\d+)\/vacation-ledger$/);
  if (method === 'GET' && ledgerUserId !== null) {
    const yearParam = new URL(url, 'http://localhost').searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    const defaultEntries = getMockLedgerEntries(ledgerUserId, year);
    const customEntries = ledgerEntries.filter(e => e.user_id === ledgerUserId && e.year === year);
    return of(jsonResponse({ data: [...defaultEntries, ...customEntries] })).pipe(delay(MOCK_DELAY));
  }

  // POST /api/admin/users/:id/vacation-ledger
  if (method === 'POST' && ledgerUserId !== null) {
    const body = parseBody<{ year: number; type: string; days: number; comment?: string }>(req);
    const newEntry: VacationLedgerEntry = {
      id: nextLedgerId++,
      user_id: ledgerUserId,
      year: body.year,
      type: body.type as VacationLedgerEntry['type'],
      days: body.days,
      comment: body.comment || null,
      vacation_id: null,
      created_at: new Date().toISOString(),
    };
    ledgerEntries.push(newEntry);
    return of(jsonResponse({ data: newEntry, message: 'Ledger entry created' }, 201)).pipe(delay(MOCK_DELAY));
  }

  // DELETE /api/admin/users/:id/vacation-ledger/:entryId
  const deleteLedgerMatch = url.match(/\/api\/admin\/users\/(\d+)\/vacation-ledger\/(\d+)$/);
  if (method === 'DELETE' && deleteLedgerMatch) {
    const entryId = parseInt(deleteLedgerMatch[2], 10);
    ledgerEntries = ledgerEntries.filter(e => e.id !== entryId);
    return of(jsonResponse(null, 200)).pipe(delay(MOCK_DELAY));
  }

  // GET /api/admin/blackouts
  if (method === 'GET' && url.endsWith('/api/admin/blackouts')) {
    return of(jsonResponse({ data: blackouts })).pipe(delay(MOCK_DELAY));
  }

  // POST /api/admin/blackouts
  if (method === 'POST' && url.endsWith('/api/admin/blackouts')) {
    const body = parseBody<{ type: 'freeze' | 'company_holiday'; start_date: string; end_date: string; reason: string }>(req);
    const newBlackout: BlackoutPeriod = {
      id: nextBlackoutId++,
      type: body.type,
      start_date: body.start_date,
      end_date: body.end_date,
      reason: body.reason,
      created_at: new Date().toISOString(),
    };
    blackouts.push(newBlackout);
    return of(jsonResponse({ data: newBlackout, message: 'Blackout created' }, 201)).pipe(delay(MOCK_DELAY));
  }

  // PATCH /api/admin/blackouts/:id
  const patchBlackoutId = extractIdFromUrl(url, /\/api\/admin\/blackouts\/(\d+)$/);
  if (method === 'PATCH' && patchBlackoutId !== null) {
    const body = parseBody<{ type: 'freeze' | 'company_holiday'; start_date: string; end_date: string; reason: string }>(req);
    const blackout = blackouts.find(b => b.id === patchBlackoutId);
    if (blackout) {
      blackout.type = body.type;
      blackout.start_date = body.start_date;
      blackout.end_date = body.end_date;
      blackout.reason = body.reason;
      return of(jsonResponse({ data: blackout, message: 'Blackout updated' })).pipe(delay(MOCK_DELAY));
    }
    return of(jsonResponse({ message: 'Not found' }, 404)).pipe(delay(MOCK_DELAY));
  }

  // DELETE /api/admin/blackouts/:id
  const deleteBlackoutId = extractIdFromUrl(url, /\/api\/admin\/blackouts\/(\d+)$/);
  if (method === 'DELETE' && deleteBlackoutId !== null) {
    blackouts = blackouts.filter(b => b.id !== deleteBlackoutId);
    return of(jsonResponse(null, 200)).pipe(delay(MOCK_DELAY));
  }

  // GET /api/blackouts/check
  if (method === 'GET' && url.includes('/api/blackouts/check')) {
    const params = new URL(url, 'http://localhost').searchParams;
    const startDate = params.get('start_date') || '';
    const endDate = params.get('end_date') || '';
    const overlapping = blackouts.filter(b =>
      b.start_date <= endDate && b.end_date >= startDate
    );
    return of(jsonResponse({ data: overlapping })).pipe(delay(MOCK_DELAY));
  }

  // Fallback: pass through to real backend
  return next(req);
};
