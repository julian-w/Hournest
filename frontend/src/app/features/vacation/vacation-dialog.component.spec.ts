import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { BlackoutPeriod } from '../../core/models/blackout-period.model';
import { BlackoutService } from '../../core/services/blackout.service';
import { HolidayService } from '../../core/services/holiday.service';
import { VacationService } from '../../core/services/vacation.service';
import { VacationDialogComponent } from './vacation-dialog.component';

describe('VacationDialogComponent', () => {
  let vacationServiceStub: {
    requestVacation: jasmine.Spy;
  };
  let holidayServiceStub: {
    isYearConfirmed: jasmine.Spy;
  };
  let blackoutServiceStub: {
    checkDate: jasmine.Spy;
  };
  let dialogRefStub: {
    close: jasmine.Spy;
  };

  beforeEach(async () => {
    vacationServiceStub = {
      requestVacation: jasmine.createSpy('requestVacation').and.returnValue(of({
        id: 1,
        user_id: 5,
        start_date: '2026-06-10',
        end_date: '2026-06-10',
        scope: 'full_day',
        workdays: 1,
        status: 'pending',
        comment: 'Trip',
        reviewed_by: null,
        reviewed_at: null,
        created_at: '2026-05-01T10:00:00Z',
      })),
    };

    holidayServiceStub = {
      isYearConfirmed: jasmine.createSpy('isYearConfirmed').and.returnValue(of(true)),
    };

    blackoutServiceStub = {
      checkDate: jasmine.createSpy('checkDate').and.returnValue(of(null)),
    };

    dialogRefStub = {
      close: jasmine.createSpy('close'),
    };

    await TestBed.configureTestingModule({
      imports: [
        VacationDialogComponent,
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
        { provide: HolidayService, useValue: holidayServiceStub },
        { provide: BlackoutService, useValue: blackoutServiceStub },
        { provide: MatDialogRef, useValue: dialogRefStub },
        { provide: MAT_DIALOG_DATA, useValue: null },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  function setDates(component: VacationDialogComponent, start: Date, end: Date): void {
    component.form.patchValue({
      startDate: start,
      endDate: end,
    });
  }

  it('should check the current year on init', () => {
    const fixture = TestBed.createComponent(VacationDialogComponent);
    fixture.detectChanges();

    expect(holidayServiceStub.isYearConfirmed).toHaveBeenCalledWith(new Date().getFullYear());
  });

  it('should sync the end date to the start date for half-day scopes', () => {
    const fixture = TestBed.createComponent(VacationDialogComponent);
    fixture.detectChanges();

    const startDate = new Date('2026-06-10T00:00:00');
    fixture.componentInstance.form.patchValue({
      startDate,
      endDate: new Date('2026-06-12T00:00:00'),
      scope: 'morning',
    });

    fixture.componentInstance.onScopeChange();

    expect(fixture.componentInstance.form.value.endDate).toEqual(startDate);
  });

  it('should show a holiday warning for unconfirmed years', () => {
    holidayServiceStub.isYearConfirmed.and.returnValue(of(false));
    const fixture = TestBed.createComponent(VacationDialogComponent);
    fixture.detectChanges();

    const startDate = new Date('2027-01-12T00:00:00');
    setDates(fixture.componentInstance, startDate, startDate);

    fixture.componentInstance.onDateChange();

    expect(fixture.componentInstance.holidayWarning()).toBeTrue();
  });

  it('should show a freeze blackout warning when a blackout is returned', () => {
    const blackout: BlackoutPeriod = {
      id: 7,
      type: 'freeze',
      start_date: '2026-07-01',
      end_date: '2026-07-03',
      reason: 'Peak season',
      created_at: '2026-01-01T00:00:00Z',
    };
    blackoutServiceStub.checkDate.and.returnValue(of(blackout));

    const fixture = TestBed.createComponent(VacationDialogComponent);
    fixture.detectChanges();

    const startDate = new Date('2026-07-01T00:00:00');
    const endDate = new Date('2026-07-03T00:00:00');
    setDates(fixture.componentInstance, startDate, endDate);

    fixture.componentInstance.onDateChange();

    expect(blackoutServiceStub.checkDate).toHaveBeenCalledWith('2026-07-01', '2026-07-03');
    expect(fixture.componentInstance.blackoutWarning()).toBeTrue();
    expect(fixture.componentInstance.blackoutType()).toBe('freeze');
    expect(fixture.componentInstance.blackoutReason()).toBe('Peak season');
  });

  it('should submit a valid vacation request and close the dialog', () => {
    const fixture = TestBed.createComponent(VacationDialogComponent);
    fixture.detectChanges();

    const startDate = new Date('2026-06-10T00:00:00');
    setDates(fixture.componentInstance, startDate, startDate);
    fixture.componentInstance.form.patchValue({
      scope: 'afternoon',
      comment: 'Family event',
    });

    fixture.componentInstance.submit();

    expect(vacationServiceStub.requestVacation).toHaveBeenCalledWith(
      '2026-06-10',
      '2026-06-10',
      'afternoon',
      'Family event',
    );
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });

  it('should not submit while warnings are active', () => {
    const fixture = TestBed.createComponent(VacationDialogComponent);
    fixture.detectChanges();

    const startDate = new Date('2026-06-10T00:00:00');
    setDates(fixture.componentInstance, startDate, startDate);
    fixture.componentInstance.blackoutWarning.set(true);

    fixture.componentInstance.submit();

    expect(vacationServiceStub.requestVacation).not.toHaveBeenCalled();
    expect(dialogRefStub.close).not.toHaveBeenCalled();
  });

  it('should map overlap backend errors to the translated overlap message key', () => {
    vacationServiceStub.requestVacation.and.returnValue(
      throwError(() => ({
        error: {
          message: 'Vacation overlap detected.',
        },
      })),
    );

    const fixture = TestBed.createComponent(VacationDialogComponent);
    fixture.detectChanges();

    const startDate = new Date('2026-06-10T00:00:00');
    setDates(fixture.componentInstance, startDate, startDate);

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.error).toBe('vacation_dialog.error_overlap');
    expect(fixture.componentInstance.submitting).toBeFalse();
  });

  it('should map company-holiday blackout backend errors to the translated message key', () => {
    vacationServiceStub.requestVacation.and.returnValue(
      throwError(() => ({
        error: {
          message: 'Vacation request overlaps with a company holiday.',
        },
      })),
    );

    const fixture = TestBed.createComponent(VacationDialogComponent);
    fixture.detectChanges();

    const startDate = new Date('2026-06-10T00:00:00');
    setDates(fixture.componentInstance, startDate, startDate);
    fixture.componentInstance.blackoutReason.set('Bridge day');

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.error).toBe('vacation_dialog.error_blackout_company_holiday');
  });

  it('should use the backend blackout reason when the dialog did not know it yet', () => {
    vacationServiceStub.requestVacation.and.returnValue(
      throwError(() => ({
        error: {
          message: 'Vacation request falls within a vacation freeze.',
          reason: 'Quarter-end lock',
        },
      })),
    );

    const fixture = TestBed.createComponent(VacationDialogComponent);
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      vacation_dialog: {
        error_blackout_freeze: 'Freeze reason: {{reason}}',
      },
    }, true);
    fixture.detectChanges();

    const startDate = new Date('2026-06-10T00:00:00');
    setDates(fixture.componentInstance, startDate, startDate);

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.error).toBe('Freeze reason: Quarter-end lock');
  });
});
