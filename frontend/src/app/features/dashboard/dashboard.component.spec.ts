import { Signal, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { User } from '../../core/models/user.model';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { VacationService } from '../../core/services/vacation.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let vacationServiceStub: {
    getMyVacations: jasmine.Spy;
    getTeamVacations: jasmine.Spy;
  };
  let adminServiceStub: {
    getPendingVacations: jasmine.Spy;
  };

  function isoDate(offsetDays: number): string {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split('T')[0];
  }

  function createAuthServiceStub(role: User['role']): {
    user: Signal<User | null>;
    isAdmin: Signal<boolean>;
  } {
    const user = signal<User | null>({
      id: 7,
      email: 'user@example.com',
      display_name: role === 'admin' ? 'Admin User' : 'Employee User',
      role,
      vacation_days_per_year: 30,
      remaining_vacation_days: 19,
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
      getMyVacations: jasmine.createSpy('getMyVacations').and.returnValue(of([
        {
          id: 1,
          user_id: 7,
          user_name: 'Employee User',
          start_date: isoDate(-5),
          end_date: isoDate(-4),
          scope: 'full_day',
          workdays: 2,
          status: 'approved',
          comment: null,
          reviewed_by: 2,
          reviewed_at: '2026-04-01T08:00:00Z',
          created_at: '2026-03-20T08:00:00Z',
        },
        {
          id: 2,
          user_id: 7,
          user_name: 'Employee User',
          start_date: isoDate(3),
          end_date: isoDate(4),
          scope: 'full_day',
          workdays: 2,
          status: 'approved',
          comment: null,
          reviewed_by: 2,
          reviewed_at: '2026-04-02T08:00:00Z',
          created_at: '2026-03-21T08:00:00Z',
        },
        {
          id: 3,
          user_id: 7,
          user_name: 'Employee User',
          start_date: isoDate(10),
          end_date: isoDate(10),
          scope: 'full_day',
          workdays: 1,
          status: 'pending',
          comment: null,
          reviewed_by: null,
          reviewed_at: null,
          created_at: '2026-03-22T08:00:00Z',
        },
      ])),
      getTeamVacations: jasmine.createSpy('getTeamVacations').and.returnValue(of([
        {
          id: 11,
          user_id: 5,
          user_name: 'Colleague Today',
          start_date: isoDate(0),
          end_date: isoDate(0),
          scope: 'full_day',
          workdays: 1,
          status: 'approved',
          comment: null,
          reviewed_by: 2,
          reviewed_at: '2026-04-02T08:00:00Z',
          created_at: '2026-03-22T08:00:00Z',
        },
        {
          id: 12,
          user_id: 6,
          user_name: 'Future Colleague',
          start_date: isoDate(5),
          end_date: isoDate(6),
          scope: 'full_day',
          workdays: 2,
          status: 'approved',
          comment: null,
          reviewed_by: 2,
          reviewed_at: '2026-04-03T08:00:00Z',
          created_at: '2026-03-23T08:00:00Z',
        },
      ])),
    };

    adminServiceStub = {
      getPendingVacations: jasmine.createSpy('getPendingVacations').and.returnValue(of([
        {
          id: 21,
          user_id: 9,
          user_name: 'Pending Person',
          start_date: isoDate(2),
          end_date: isoDate(3),
          scope: 'full_day',
          workdays: 2,
          status: 'pending',
          comment: null,
          reviewed_by: null,
          reviewed_at: null,
          created_at: '2026-03-24T08:00:00Z',
        },
      ])),
    };

    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateNoOpLoader,
          },
        }),
      ],
      providers: [
        { provide: VacationService, useValue: vacationServiceStub },
        { provide: AdminService, useValue: adminServiceStub },
        { provide: AuthService, useValue: createAuthServiceStub('employee') },
        provideRouter([]),
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  it('should load employee dashboard data and derive pending and next vacation', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    expect(vacationServiceStub.getMyVacations).toHaveBeenCalled();
    expect(adminServiceStub.getPendingVacations).not.toHaveBeenCalled();
    expect(vacationServiceStub.getTeamVacations).not.toHaveBeenCalled();
    expect(fixture.componentInstance.pendingCount()).toBe(1);
    expect(fixture.componentInstance.nextVacation()?.id).toBe(2);
    expect(fixture.componentInstance.absentToday()).toEqual([]);
  });

  it('should load admin cards and current absences for admins', async () => {
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateNoOpLoader,
          },
        }),
      ],
      providers: [
        { provide: VacationService, useValue: vacationServiceStub },
        { provide: AdminService, useValue: adminServiceStub },
        { provide: AuthService, useValue: createAuthServiceStub('admin') },
        provideRouter([]),
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');

    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    expect(adminServiceStub.getPendingVacations).toHaveBeenCalled();
    expect(vacationServiceStub.getTeamVacations).toHaveBeenCalled();
    expect(fixture.componentInstance.adminPendingVacations().map(v => v.user_name)).toEqual(['Pending Person']);
    expect(fixture.componentInstance.absentToday().map(v => v.user_name)).toEqual(['Colleague Today']);
    expect(fixture.nativeElement.textContent).toContain('Pending Person');
    expect(fixture.nativeElement.textContent).toContain('Colleague Today');
  });
});
