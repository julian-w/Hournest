import { Signal, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { HolidayService } from '../../core/services/holiday.service';
import { VacationService } from '../../core/services/vacation.service';
import { User } from '../../core/models/user.model';
import { CalendarComponent } from './calendar.component';

describe('CalendarComponent', () => {
  let vacationServiceStub: {
    getTeamVacations: jasmine.Spy;
  };
  let holidayServiceStub: {
    getHolidays: jasmine.Spy;
  };

  function createAuthServiceStub(role: User['role']): {
    user: Signal<User | null>;
    isAdmin: Signal<boolean>;
  } {
    const user = signal<User | null>({
      id: 3,
      email: 'user@example.com',
      display_name: 'Test User',
      role,
      vacation_days_per_year: 30,
      remaining_vacation_days: 24,
      holidays_exempt: false,
      weekend_worker: false,
    });

    return {
      user: user.asReadonly(),
      isAdmin: computed(() => {
        const currentRole = user()?.role;
        return currentRole === 'admin' || currentRole === 'superadmin';
      }),
    };
  }

  beforeEach(async () => {
    vacationServiceStub = {
      getTeamVacations: jasmine.createSpy('getTeamVacations').and.returnValue(of([
        {
          id: 11,
          user_id: 3,
          user_name: 'Test User',
          start_date: '2026-04-08',
          end_date: '2026-04-10',
          scope: 'full_day',
          workdays: 3,
          status: 'approved',
          comment: null,
          reviewed_by: 9,
          reviewed_at: '2026-03-01T08:00:00Z',
          created_at: '2026-02-20T08:00:00Z',
        },
        {
          id: 12,
          user_id: 5,
          user_name: 'Shared Group Colleague',
          start_date: '2026-04-09',
          end_date: '2026-04-09',
          scope: 'full_day',
          workdays: 1,
          status: 'approved',
          comment: null,
          reviewed_by: 9,
          reviewed_at: '2026-03-02T08:00:00Z',
          created_at: '2026-02-21T08:00:00Z',
        },
      ])),
    };

    holidayServiceStub = {
      getHolidays: jasmine.createSpy('getHolidays').and.returnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [
        CalendarComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: VacationService, useValue: vacationServiceStub },
        { provide: HolidayService, useValue: holidayServiceStub },
        { provide: AuthService, useValue: createAuthServiceStub('employee') },
      ],
    }).compileComponents();
  });

  it('should load calendar vacations and holidays on init', () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();

    expect(vacationServiceStub.getTeamVacations).toHaveBeenCalled();
    expect(holidayServiceStub.getHolidays).toHaveBeenCalledWith(jasmine.any(Number));
    expect(fixture.componentInstance.legend()).toEqual([
      { userId: 3, name: 'Test User' },
      { userId: 5, name: 'Shared Group Colleague' },
    ]);
  });

  it('should show the employee visibility hint for non-admin users', () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.visibilityHintKey()).toBe('calendar.visibility.employee');
    expect(fixture.nativeElement.textContent).toContain('calendar.visibility.employee');
  });

  it('should show the admin visibility hint for admins', async () => {
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [
        CalendarComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: VacationService, useValue: vacationServiceStub },
        { provide: HolidayService, useValue: holidayServiceStub },
        { provide: AuthService, useValue: createAuthServiceStub('admin') },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.visibilityHintKey()).toBe('calendar.visibility.admin');
    expect(fixture.nativeElement.textContent).toContain('calendar.visibility.admin');
  });
});
