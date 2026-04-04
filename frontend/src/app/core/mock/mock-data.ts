import { User } from '../models/user.model';
import { Vacation } from '../models/vacation.model';
import { Holiday } from '../models/holiday.model';
import { VacationLedgerEntry } from '../models/vacation-ledger-entry.model';
import { WorkSchedule } from '../models/work-schedule.model';
import { AppSetting } from '../models/setting.model';

export const MOCK_USERS: User[] = [
  {
    id: 1,
    email: 'anna@hournest.local',
    display_name: 'Anna Admin',
    role: 'admin',
    vacation_days_per_year: 30,
    remaining_vacation_days: 22,
    holidays_exempt: false,
    weekend_worker: false,
  },
  {
    id: 2,
    email: 'max@hournest.local',
    display_name: 'Max Mustermann',
    role: 'employee',
    vacation_days_per_year: 30,
    remaining_vacation_days: 18,
    holidays_exempt: false,
    weekend_worker: false,
  },
  {
    id: 3,
    email: 'sarah@hournest.local',
    display_name: 'Sarah Schmidt',
    role: 'employee',
    vacation_days_per_year: 28,
    remaining_vacation_days: 20,
    holidays_exempt: false,
    weekend_worker: false,
  },
  {
    id: 4,
    email: 'tom@hournest.local',
    display_name: 'Tom Weber',
    role: 'employee',
    vacation_days_per_year: 30,
    remaining_vacation_days: 15,
    holidays_exempt: true,
    weekend_worker: false,
  },
  {
    id: 5,
    email: 'lisa@hournest.local',
    display_name: 'Lisa Braun',
    role: 'employee',
    vacation_days_per_year: 30,
    remaining_vacation_days: 28,
    holidays_exempt: false,
    weekend_worker: true,
  },
  {
    id: 6,
    email: 'superadmin@hournest.local',
    display_name: 'Superadmin',
    role: 'superadmin',
    vacation_days_per_year: 0,
    remaining_vacation_days: 0,
    holidays_exempt: false,
    weekend_worker: false,
  },
];

export const MOCK_VACATIONS: Vacation[] = [
  {
    id: 1,
    user_id: 2,
    user_name: 'Max Mustermann',
    start_date: '2026-04-06',
    end_date: '2026-04-17',
    scope: 'full_day',
    workdays: 10,
    status: 'approved',
    comment: null,
    reviewed_by: 1,
    reviewer_name: 'Anna Admin',
    reviewed_at: '2026-03-15T10:00:00+00:00',
    created_at: '2026-03-10T09:00:00+00:00',
  },
  {
    id: 2,
    user_id: 2,
    user_name: 'Max Mustermann',
    start_date: '2026-08-03',
    end_date: '2026-08-14',
    scope: 'full_day',
    workdays: 10,
    status: 'pending',
    comment: 'Sommerurlaub',
    reviewed_by: null,
    reviewer_name: undefined,
    reviewed_at: null,
    created_at: '2026-03-20T14:00:00+00:00',
  },
  {
    id: 3,
    user_id: 3,
    user_name: 'Sarah Schmidt',
    start_date: '2026-05-18',
    end_date: '2026-05-29',
    scope: 'full_day',
    workdays: 10,
    status: 'approved',
    comment: null,
    reviewed_by: 1,
    reviewer_name: 'Anna Admin',
    reviewed_at: '2026-04-01T10:00:00+00:00',
    created_at: '2026-03-25T11:00:00+00:00',
  },
  {
    id: 4,
    user_id: 3,
    user_name: 'Sarah Schmidt',
    start_date: '2026-04-06',
    end_date: '2026-04-10',
    scope: 'full_day',
    workdays: 5,
    status: 'rejected',
    comment: 'Zu viele Teammitglieder bereits abwesend.',
    reviewed_by: 1,
    reviewer_name: 'Anna Admin',
    reviewed_at: '2026-03-20T10:00:00+00:00',
    created_at: '2026-03-18T09:00:00+00:00',
  },
  {
    id: 5,
    user_id: 4,
    user_name: 'Tom Weber',
    start_date: '2026-07-06',
    end_date: '2026-07-24',
    scope: 'full_day',
    workdays: 15,
    status: 'approved',
    comment: null,
    reviewed_by: 1,
    reviewer_name: 'Anna Admin',
    reviewed_at: '2026-05-15T10:00:00+00:00',
    created_at: '2026-05-10T09:00:00+00:00',
  },
  {
    id: 6,
    user_id: 1,
    user_name: 'Anna Admin',
    start_date: '2026-06-15',
    end_date: '2026-06-19',
    scope: 'full_day',
    workdays: 5,
    status: 'approved',
    comment: null,
    reviewed_by: 1,
    reviewer_name: 'Anna Admin',
    reviewed_at: '2026-05-01T10:00:00+00:00',
    created_at: '2026-04-28T09:00:00+00:00',
  },
  {
    id: 7,
    user_id: 5,
    user_name: 'Lisa Braun',
    start_date: '2026-09-01',
    end_date: '2026-09-05',
    scope: 'full_day',
    workdays: 5,
    status: 'pending',
    comment: 'Kurztrip',
    reviewed_by: null,
    reviewer_name: undefined,
    reviewed_at: null,
    created_at: '2026-03-25T16:00:00+00:00',
  },
  {
    id: 8,
    user_id: 4,
    user_name: 'Tom Weber',
    start_date: '2026-03-23',
    end_date: '2026-03-27',
    scope: 'full_day',
    workdays: 5,
    status: 'approved',
    comment: null,
    reviewed_by: 1,
    reviewer_name: 'Anna Admin',
    reviewed_at: '2026-03-10T10:00:00+00:00',
    created_at: '2026-03-05T09:00:00+00:00',
  },
];

// Holidays now have start_year and end_year.
// Fixed holidays auto-repeat yearly with the same month/day.
// Variable holidays need a date set per year by the admin.
export const MOCK_HOLIDAYS: Holiday[] = [
  { id: 1, name: 'Neujahr', date: '2026-01-01', type: 'fixed', start_year: 2026, end_year: null },
  { id: 2, name: 'Karfreitag', date: '2026-04-03', type: 'variable', start_year: 2026, end_year: null },
  { id: 3, name: 'Ostermontag', date: '2026-04-06', type: 'variable', start_year: 2026, end_year: null },
  { id: 4, name: 'Tag der Arbeit', date: '2026-05-01', type: 'fixed', start_year: 2026, end_year: null },
  { id: 5, name: 'Christi Himmelfahrt', date: '2026-05-14', type: 'variable', start_year: 2026, end_year: null },
  { id: 6, name: 'Pfingstmontag', date: '2026-05-25', type: 'variable', start_year: 2026, end_year: null },
  { id: 7, name: 'Tag der Deutschen Einheit', date: '2026-10-03', type: 'fixed', start_year: 2026, end_year: null },
  { id: 8, name: '1. Weihnachtstag', date: '2026-12-25', type: 'fixed', start_year: 2026, end_year: null },
  { id: 9, name: '2. Weihnachtstag', date: '2026-12-26', type: 'fixed', start_year: 2026, end_year: null },
];

// Variable holiday dates per year (holiday_id -> year -> date)
// 2026 dates are set, 2027 dates are NOT set yet (to demo the red/pending state)
export const MOCK_VARIABLE_DATES: Record<number, Record<number, string>> = {
  2: { 2026: '2026-04-03' },   // Karfreitag
  3: { 2026: '2026-04-06' },   // Ostermontag
  5: { 2026: '2026-05-14' },   // Christi Himmelfahrt
  6: { 2026: '2026-05-25' },   // Pfingstmontag
};

export const MOCK_SETTINGS: AppSetting[] = [
  { key: 'default_work_days', value: '[1,2,3,4,5]' },
  { key: 'weekend_is_free', value: 'true' },
  { key: 'carryover_enabled', value: 'true' },
  { key: 'carryover_expiry_date', value: '31.03' },
  { key: 'vacation_booking_start', value: '01.10' },
];

export function getMockLedgerEntries(userId: number, year: number): VacationLedgerEntry[] {
  const user = MOCK_USERS.find(u => u.id === userId);
  if (!user) return [];

  const entries: VacationLedgerEntry[] = [
    {
      id: userId * 100 + 1,
      user_id: userId,
      year,
      type: 'entitlement',
      days: user.vacation_days_per_year,
      comment: `Jahresanspruch ${year}`,
      vacation_id: null,
      created_at: `${year}-01-01T00:00:00+00:00`,
    },
  ];

  if (year === 2026) {
    if (userId === 2) {
      entries.push({
        id: userId * 100 + 2,
        user_id: userId,
        year,
        type: 'carryover',
        days: 3,
        comment: 'Übertrag aus 2025',
        vacation_id: null,
        created_at: `${year}-01-01T00:00:00+00:00`,
      });
    }
    if (userId === 4) {
      entries.push({
        id: userId * 100 + 2,
        user_id: userId,
        year,
        type: 'bonus',
        days: 1,
        comment: 'Firmenjubiläum',
        vacation_id: null,
        created_at: `${year}-02-15T00:00:00+00:00`,
      });
    }

    const userVacations = MOCK_VACATIONS.filter(
      v => v.user_id === userId && v.status === 'approved' && v.start_date.startsWith(`${year}`)
    );
    userVacations.forEach((v, i) => {
      entries.push({
        id: userId * 100 + 10 + i,
        user_id: userId,
        year,
        type: 'taken',
        days: -v.workdays,
        comment: `${v.start_date} bis ${v.end_date}`,
        vacation_id: v.id,
        created_at: v.reviewed_at || v.created_at,
      });
    });
  }

  return entries;
}

export const MOCK_WORK_SCHEDULES: WorkSchedule[] = [
  {
    id: 1,
    user_id: 5,
    start_date: '2026-07-01',
    end_date: '2026-12-31',
    work_days: [3, 4],
  },
];
