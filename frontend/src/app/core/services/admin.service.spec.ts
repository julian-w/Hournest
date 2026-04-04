import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { Vacation } from '../models/vacation.model';
import { User } from '../models/user.model';
import { Absence } from '../models/absence.model';
import { CostCenter } from '../models/cost-center.model';
import { WorkSchedule } from '../models/work-schedule.model';
import { TimeEntry } from '../models/time-entry.model';
import { TimeBooking } from '../models/time-booking.model';
import { TimeLock } from '../models/time-lock.model';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  const vacation: Vacation = {
    id: 5,
    user_id: 9,
    user_name: 'Ada Lovelace',
    start_date: '2026-04-06',
    end_date: '2026-04-08',
    workdays: 3,
    status: 'pending',
    comment: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2026-04-01T08:00:00Z',
  };

  const user: User = {
    id: 9,
    email: 'ada@example.com',
    display_name: 'Ada Lovelace',
    role: 'employee',
    vacation_days_per_year: 30,
    remaining_vacation_days: 22,
    holidays_exempt: false,
    weekend_worker: false,
  };

  const absence: Absence = {
    id: 7,
    user_id: 9,
    user_name: 'Ada Lovelace',
    start_date: '2026-04-10',
    end_date: '2026-04-10',
    type: 'special_leave',
    scope: 'morning',
    status: 'pending',
    comment: 'Family appointment',
    admin_comment: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2026-04-08T09:00:00Z',
  };

  const costCenter: CostCenter = {
    id: 12,
    code: 'PRJ-ALPHA',
    name: 'Project Alpha',
    description: 'Main delivery project',
    is_system: false,
    is_active: true,
  };

  const workSchedule: WorkSchedule = {
    id: 3,
    user_id: 9,
    start_date: '2026-01-01',
    end_date: null,
    work_days: [1, 2, 3, 4, 5],
  };

  const timeEntry: TimeEntry = {
    id: 21,
    user_id: 9,
    date: '2026-04-07',
    start_time: '08:00',
    end_time: '17:00',
    break_minutes: 30,
    net_working_minutes: 510,
  };

  const timeBooking: TimeBooking = {
    id: 22,
    user_id: 9,
    date: '2026-04-07',
    cost_center_id: 12,
    cost_center_code: 'PRJ-ALPHA',
    cost_center_name: 'Project Alpha',
    percentage: 100,
    comment: 'Implementation',
  };

  const timeLock: TimeLock = {
    id: 4,
    year: 2026,
    month: 4,
    locked_by: 1,
    locked_by_name: 'Admin User',
    locked_at: '2026-04-30T10:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch pending vacations', () => {
    let result: Vacation[] | undefined;

    service.getPendingVacations().subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/admin/vacations/pending');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [vacation] });

    expect(result).toEqual([vacation]);
  });

  it('should review a vacation and normalize an omitted comment to null', () => {
    let result: Vacation | undefined;

    service.reviewVacation(5, 'approved').subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/admin/vacations/5');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      status: 'approved',
      comment: null,
    });
    req.flush({ data: { ...vacation, status: 'approved' } });

    expect(result?.status).toBe('approved');
  });

  it('should create a user with the given payload', () => {
    let result: User | undefined;

    service.createUser({
      display_name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'employee',
      password: 'secret123',
      vacation_days_per_year: 28,
    }).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/admin/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      display_name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'employee',
      password: 'secret123',
      vacation_days_per_year: 28,
    });
    req.flush({ data: user });

    expect(result).toEqual(user);
  });

  it('should update a user with partial fields', () => {
    let result: User | undefined;

    service.updateUser(9, {
      role: 'admin',
      holidays_exempt: true,
    }).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/admin/users/9');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      role: 'admin',
      holidays_exempt: true,
    });
    req.flush({ data: { ...user, role: 'admin', holidays_exempt: true } });

    expect(result?.role).toBe('admin');
    expect(result?.holidays_exempt).toBeTrue();
  });

  it('should fetch absences with optional filters as query params', () => {
    let result: Absence[] | undefined;

    service.getAbsences({
      status: 'pending',
      type: 'special_leave',
      user_id: 9,
    }).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne(r =>
      r.url === '/api/admin/absences'
      && r.params.get('status') === 'pending'
      && r.params.get('type') === 'special_leave'
      && r.params.get('user_id') === '9'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [absence] });

    expect(result).toEqual([absence]);
  });

  it('should create an admin absence', () => {
    let result: Absence | undefined;

    service.createAbsence({
      user_id: 9,
      start_date: '2026-04-10',
      end_date: '2026-04-10',
      type: 'special_leave',
      scope: 'morning',
      comment: 'Family appointment',
      admin_comment: 'Approved by phone',
    }).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/admin/absences');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      user_id: 9,
      start_date: '2026-04-10',
      end_date: '2026-04-10',
      type: 'special_leave',
      scope: 'morning',
      comment: 'Family appointment',
      admin_comment: 'Approved by phone',
    });
    req.flush({ data: absence });

    expect(result).toEqual(absence);
  });

  it('should fetch admin time data with required query params', () => {
    let result: { time_entries: TimeEntry[]; time_bookings: TimeBooking[] } | undefined;

    service.getUserTimeData(9, '2026-04-01', '2026-04-30').subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne(r =>
      r.url === '/api/admin/time-bookings'
      && r.params.get('user_id') === '9'
      && r.params.get('from') === '2026-04-01'
      && r.params.get('to') === '2026-04-30'
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      data: {
        time_entries: [timeEntry],
        time_bookings: [timeBooking],
      },
    });

    expect(result).toEqual({
      time_entries: [timeEntry],
      time_bookings: [timeBooking],
    });
  });

  it('should fetch and update direct user cost centers', () => {
    let fetched: CostCenter[] | undefined;
    let updated: CostCenter[] | undefined;

    service.getUserCostCenters(9).subscribe(data => {
      fetched = data;
    });
    service.setUserCostCenters(9, [12, 13]).subscribe(data => {
      updated = data;
    });

    const getReq = httpMock.expectOne('/api/admin/users/9/cost-centers');
    expect(getReq.request.method).toBe('GET');
    getReq.flush({ data: [costCenter] });

    const putReq = httpMock.expectOne('/api/admin/users/9/cost-centers');
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual({ cost_center_ids: [12, 13] });
    putReq.flush({ data: [costCenter] });

    expect(fetched).toEqual([costCenter]);
    expect(updated).toEqual([costCenter]);
  });

  it('should fetch work schedules, reset passwords, and toggle time locks', () => {
    let schedules: WorkSchedule[] | undefined;
    let resetResult: User | undefined;

    service.getWorkSchedules(9).subscribe(data => {
      schedules = data;
    });
    service.resetUserPassword(9, 'new-secret-123').subscribe(data => {
      resetResult = data;
    });
    service.toggleTimeLock(2026, 4).subscribe();

    const schedulesReq = httpMock.expectOne('/api/admin/users/9/work-schedules');
    expect(schedulesReq.request.method).toBe('GET');
    schedulesReq.flush({ data: [workSchedule] });

    const resetReq = httpMock.expectOne('/api/admin/users/9/reset-password');
    expect(resetReq.request.method).toBe('PATCH');
    expect(resetReq.request.body).toEqual({ password: 'new-secret-123' });
    resetReq.flush({ data: user });

    const toggleReq = httpMock.expectOne('/api/admin/time-locks');
    expect(toggleReq.request.method).toBe('POST');
    expect(toggleReq.request.body).toEqual({ year: 2026, month: 4 });
    toggleReq.flush({});

    expect(schedules).toEqual([workSchedule]);
    expect(resetResult).toEqual(user);
  });

  it('should fetch time locks', () => {
    let result: TimeLock[] | undefined;

    service.getTimeLocks().subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/admin/time-locks');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [timeLock] });

    expect(result).toEqual([timeLock]);
  });
});
