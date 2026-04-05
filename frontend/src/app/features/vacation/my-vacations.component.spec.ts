import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { MyVacationsComponent } from './my-vacations.component';
import { BlackoutService } from '../../core/services/blackout.service';
import { VacationService } from '../../core/services/vacation.service';
import { VacationLedgerService } from '../../core/services/vacation-ledger.service';
import { HolidayService } from '../../core/services/holiday.service';
import { AuthService } from '../../core/services/auth.service';
import { Vacation } from '../../core/models/vacation.model';
import { VacationLedgerEntry } from '../../core/models/vacation-ledger-entry.model';

describe('MyVacationsComponent', () => {
  let vacationServiceStub: {
    getMyVacations: jasmine.Spy;
    cancelVacation: jasmine.Spy;
  };
  let ledgerServiceStub: {
    getMyLedger: jasmine.Spy;
  };
  let authServiceStub: {
    user: Signal<unknown>;
    loadUser: jasmine.Spy;
  };
  const vacations: Vacation[] = [
    {
      id: 11,
      user_id: 3,
      start_date: '2026-06-01',
      end_date: '2026-06-05',
      scope: 'full_day',
      workdays: 5,
      status: 'pending',
      comment: 'Summer trip',
      reviewed_by: null,
      reviewed_at: null,
      created_at: '2026-05-01T12:00:00Z',
    },
  ];

  const ledgerEntries: VacationLedgerEntry[] = [
    {
      id: 21,
      user_id: 3,
      year: new Date().getFullYear(),
      type: 'entitlement',
      days: 30,
      comment: 'Base entitlement',
      vacation_id: null,
      created_at: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    vacationServiceStub = {
      getMyVacations: jasmine.createSpy('getMyVacations').and.returnValue(of(vacations)),
      cancelVacation: jasmine.createSpy('cancelVacation').and.returnValue(of(void 0)),
    };

    ledgerServiceStub = {
      getMyLedger: jasmine.createSpy('getMyLedger').and.returnValue(of(ledgerEntries)),
    };

    authServiceStub = {
      user: signal({
        id: 3,
        email: 'user@example.com',
        display_name: 'Test User',
        role: 'employee',
        vacation_days_per_year: 30,
        remaining_vacation_days: 25,
        holidays_exempt: false,
        weekend_worker: false,
      }).asReadonly(),
      loadUser: jasmine.createSpy('loadUser'),
    };

    await TestBed.configureTestingModule({
      imports: [
        MyVacationsComponent,
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
        { provide: VacationLedgerService, useValue: ledgerServiceStub },
        { provide: HolidayService, useValue: { getHolidays: () => of([]) } },
        { provide: BlackoutService, useValue: { checkDate: () => of(null) } },
        { provide: AuthService, useValue: authServiceStub },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  it('should load vacations and ledger entries on init', () => {
    const fixture = TestBed.createComponent(MyVacationsComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const currentYear = new Date().getFullYear();

    expect(vacationServiceStub.getMyVacations).toHaveBeenCalled();
    expect(ledgerServiceStub.getMyLedger).toHaveBeenCalledWith(currentYear);
    expect(component.vacations()).toEqual(vacations);
    expect(component.ledgerEntries()[0].type).toBe('entitlement');
    expect(component.ledgerEntries()[0].running_balance).toBe(30);
  });

  it('should reload vacations, ledger, and user after a successful request dialog close', () => {
    const fixture = TestBed.createComponent(MyVacationsComponent);
    fixture.detectChanges();
    const dialogOpenSpy = spyOn((fixture.componentInstance as never as { dialog: MatDialog }).dialog, 'open').and.returnValue({
      afterClosed: () => of(true),
    } as never);

    vacationServiceStub.getMyVacations.calls.reset();
    ledgerServiceStub.getMyLedger.calls.reset();
    authServiceStub.loadUser.calls.reset();

    fixture.componentInstance.openRequestDialog();

    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(vacationServiceStub.getMyVacations).toHaveBeenCalled();
    expect(ledgerServiceStub.getMyLedger).toHaveBeenCalled();
    expect(authServiceStub.loadUser).toHaveBeenCalled();
  });

  it('should not reload data when the request dialog closes without a result', () => {
    const fixture = TestBed.createComponent(MyVacationsComponent);
    fixture.detectChanges();
    const dialogOpenSpy = spyOn((fixture.componentInstance as never as { dialog: MatDialog }).dialog, 'open').and.returnValue({
      afterClosed: () => of(false),
    } as never);

    vacationServiceStub.getMyVacations.calls.reset();
    ledgerServiceStub.getMyLedger.calls.reset();
    authServiceStub.loadUser.calls.reset();

    fixture.componentInstance.openRequestDialog();

    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(vacationServiceStub.getMyVacations).not.toHaveBeenCalled();
    expect(ledgerServiceStub.getMyLedger).not.toHaveBeenCalled();
    expect(authServiceStub.loadUser).not.toHaveBeenCalled();
  });

  it('should cancel a vacation and refresh data', () => {
    const fixture = TestBed.createComponent(MyVacationsComponent);
    fixture.detectChanges();

    vacationServiceStub.getMyVacations.calls.reset();
    ledgerServiceStub.getMyLedger.calls.reset();
    authServiceStub.loadUser.calls.reset();

    fixture.componentInstance.cancelVacation(vacations[0]);

    expect(vacationServiceStub.cancelVacation).toHaveBeenCalledWith(11);
    expect(vacationServiceStub.getMyVacations).toHaveBeenCalled();
    expect(ledgerServiceStub.getMyLedger).toHaveBeenCalled();
    expect(authServiceStub.loadUser).toHaveBeenCalled();
  });

  it('should change the selected year and reload the ledger', () => {
    const fixture = TestBed.createComponent(MyVacationsComponent);
    fixture.detectChanges();

    ledgerServiceStub.getMyLedger.calls.reset();

    fixture.componentInstance.onYearChange(2030);

    expect(fixture.componentInstance.selectedYear()).toBe(2030);
    expect(ledgerServiceStub.getMyLedger).toHaveBeenCalledWith(2030);
  });
});
