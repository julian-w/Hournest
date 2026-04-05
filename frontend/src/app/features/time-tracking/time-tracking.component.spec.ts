import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AbsenceService } from '../../core/services/absence.service';
import { BlackoutService } from '../../core/services/blackout.service';
import { CostCenterService } from '../../core/services/cost-center.service';
import { SettingsService } from '../../core/services/settings.service';
import { TimeBookingTemplateService } from '../../core/services/time-booking-template.service';
import { TimeTrackingService } from '../../core/services/time-tracking.service';
import { VacationService } from '../../core/services/vacation.service';
import { WorkTimeAccountService } from '../../core/services/work-time-account.service';
import { WorkScheduleService } from '../../core/services/work-schedule.service';
import { TimeTrackingComponent } from './time-tracking.component';

describe('TimeTrackingComponent', () => {
  let timeServiceStub: {
    getTimeEntries: jasmine.Spy;
    getTimeBookings: jasmine.Spy;
    saveTimeEntry: jasmine.Spy;
    saveTimeBookings: jasmine.Spy;
  };
  let templateServiceStub: {
    getTemplates: jasmine.Spy;
    createTemplate: jasmine.Spy;
    updateTemplate: jasmine.Spy;
    deleteTemplate: jasmine.Spy;
  };
  let costCenterServiceStub: {
    getAvailableCostCenters: jasmine.Spy;
    getFavorites: jasmine.Spy;
  };
  let absenceServiceStub: {
    getMyAbsences: jasmine.Spy;
  };
  let blackoutServiceStub: {
    getMatchingBlackouts: jasmine.Spy;
  };
  let vacationServiceStub: {
    getMyVacations: jasmine.Spy;
  };
  let settingsServiceStub: {
    getPublicSettings: jasmine.Spy;
  };
  let workScheduleServiceStub: {
    getMyWorkSchedules: jasmine.Spy;
  };
  let workTimeAccountServiceStub: {
    getMyLedger: jasmine.Spy;
  };
  let dialogStub: {
    open: jasmine.Spy;
  };
  let snackBarStub: {
    open: jasmine.Spy;
  };

  const costCenters = [
    { id: 21, code: 'PRJ-ALPHA', name: 'Project Alpha', description: null, is_system: false, is_active: true },
    { id: 22, code: 'INT', name: 'Internal', description: null, is_system: false, is_active: true },
  ];

  const template = {
    id: 7,
    user_id: 3,
    name: 'Standard Day',
    items: [
      { id: 1, cost_center_id: 21, cost_center_name: 'Project Alpha', cost_center_code: 'PRJ-ALPHA', percentage: 60 },
      { id: 2, cost_center_id: 22, cost_center_name: 'Internal', cost_center_code: 'INT', percentage: 40 },
    ],
  };

  beforeEach(async () => {
    timeServiceStub = {
      getTimeEntries: jasmine.createSpy('getTimeEntries').and.returnValue(of([])),
      getTimeBookings: jasmine.createSpy('getTimeBookings').and.returnValue(of([])),
      saveTimeEntry: jasmine.createSpy('saveTimeEntry').and.returnValue(of({
        id: 1,
        user_id: 3,
        date: '2026-04-06',
        start_time: '08:00',
        end_time: '17:00',
        break_minutes: 30,
        net_working_minutes: 510,
      })),
      saveTimeBookings: jasmine.createSpy('saveTimeBookings').and.returnValue(of([])),
    };

    templateServiceStub = {
      getTemplates: jasmine.createSpy('getTemplates').and.returnValue(of([template])),
      createTemplate: jasmine.createSpy('createTemplate').and.returnValue(of(template)),
      updateTemplate: jasmine.createSpy('updateTemplate').and.returnValue(of(template)),
      deleteTemplate: jasmine.createSpy('deleteTemplate').and.returnValue(of(void 0)),
    };

    costCenterServiceStub = {
      getAvailableCostCenters: jasmine.createSpy('getAvailableCostCenters').and.returnValue(of(costCenters)),
      getFavorites: jasmine.createSpy('getFavorites').and.returnValue(of([costCenters[0]])),
    };

    absenceServiceStub = {
      getMyAbsences: jasmine.createSpy('getMyAbsences').and.returnValue(of([])),
    };

    blackoutServiceStub = {
      getMatchingBlackouts: jasmine.createSpy('getMatchingBlackouts').and.returnValue(of([])),
    };

    vacationServiceStub = {
      getMyVacations: jasmine.createSpy('getMyVacations').and.returnValue(of([])),
    };

    settingsServiceStub = {
      getPublicSettings: jasmine.createSpy('getPublicSettings').and.returnValue(of([
        { key: 'default_weekly_target_minutes', value: '2400' },
      ])),
    };

    workScheduleServiceStub = {
      getMyWorkSchedules: jasmine.createSpy('getMyWorkSchedules').and.returnValue(of([])),
    };

    workTimeAccountServiceStub = {
      getMyLedger: jasmine.createSpy('getMyLedger').and.returnValue(of([])),
    };

    dialogStub = {
      open: jasmine.createSpy('open').and.returnValue({
        afterClosed: () => of('Focus Day'),
      }),
    };

    snackBarStub = {
      open: jasmine.createSpy('open'),
    };

    await TestBed.configureTestingModule({
      imports: [
        TimeTrackingComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateNoOpLoader,
          },
        }),
      ],
      providers: [
        { provide: TimeTrackingService, useValue: timeServiceStub },
        { provide: TimeBookingTemplateService, useValue: templateServiceStub },
        { provide: CostCenterService, useValue: costCenterServiceStub },
        { provide: AbsenceService, useValue: absenceServiceStub },
        { provide: BlackoutService, useValue: blackoutServiceStub },
        { provide: VacationService, useValue: vacationServiceStub },
        { provide: SettingsService, useValue: settingsServiceStub },
        { provide: WorkScheduleService, useValue: workScheduleServiceStub },
        { provide: WorkTimeAccountService, useValue: workTimeAccountServiceStub },
        { provide: MatDialog, useValue: dialogStub },
        { provide: MatSnackBar, useValue: snackBarStub },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  it('should load templates and apply the selected template to the chosen day', () => {
    const fixture = TestBed.createComponent(TimeTrackingComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const date = component.selectedTemplateDate();

    component.applySelectedTemplate();

    const firstRow = component.bookingRows()[0];
    const secondRow = component.bookingRows()[1];

    expect(templateServiceStub.getTemplates).toHaveBeenCalled();
    expect(component.templates()).toEqual([template]);
    expect(firstRow.percentages[date]).toBe(60);
    expect(secondRow.percentages[date]).toBe(40);
  });

  it('should place favorite cost centers first and mark them as favorites in the booking rows', () => {
    const fixture = TestBed.createComponent(TimeTrackingComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const rows = component.bookingRows();

    expect(costCenterServiceStub.getAvailableCostCenters).toHaveBeenCalled();
    expect(costCenterServiceStub.getFavorites).toHaveBeenCalled();
    expect(rows.map(row => row.costCenter.id)).toEqual([21, 22]);
    expect(rows[0].isFavorite).toBeTrue();
    expect(rows[0].costCenter.name).toBe('Project Alpha');
    expect(rows[1].isFavorite).toBeFalse();
  });

  it('should create a template from the selected day bookings', () => {
    const fixture = TestBed.createComponent(TimeTrackingComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const date = component.selectedTemplateDate();

    component.onPercentageChange(component.bookingRows()[0], date, 70);
    component.onPercentageChange(component.bookingRows()[1], date, 30);
    component.openSaveTemplateDialog();

    expect(dialogStub.open).toHaveBeenCalled();
    expect(templateServiceStub.createTemplate).toHaveBeenCalledWith({
      name: 'Focus Day',
      items: [
        { cost_center_id: 21, percentage: 70 },
        { cost_center_id: 22, percentage: 30 },
      ],
    });
  });

  it('should show a message instead of saving when no day has a valid total', () => {
    const fixture = TestBed.createComponent(TimeTrackingComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const snackBarOpenSpy = spyOn((component as never as { snackBar: MatSnackBar }).snackBar, 'open');
    const date = component.selectedTemplateDate();

    component.onPercentageChange(component.bookingRows()[0], date, 70);

    component.saveAll();

    expect(timeServiceStub.saveTimeBookings).not.toHaveBeenCalled();
    expect(snackBarOpenSpy).toHaveBeenCalledWith('time_tracking.nothing_to_save', 'common.ok', { duration: 3000 });
  });

  it('should show an error message when saving bookings fails', () => {
    const fixture = TestBed.createComponent(TimeTrackingComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const snackBarOpenSpy = spyOn((component as never as { snackBar: MatSnackBar }).snackBar, 'open');
    const date = component.selectedTemplateDate();

    component.onPercentageChange(component.bookingRows()[0], date, 60);
    component.onPercentageChange(component.bookingRows()[1], date, 40);
    timeServiceStub.saveTimeBookings.and.returnValue({
      subscribe: ({ error }: { error: () => void }) => error(),
    } as never);

    component.saveAll();

    expect(timeServiceStub.saveTimeBookings).toHaveBeenCalled();
    expect(snackBarOpenSpy).toHaveBeenCalledWith('time_tracking.save_error', 'common.ok', { duration: 3000 });
  });

  it('should update the selected template with the selected day bookings', () => {
    const fixture = TestBed.createComponent(TimeTrackingComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const date = component.selectedTemplateDate();

    component.onPercentageChange(component.bookingRows()[0], date, 50);
    component.onPercentageChange(component.bookingRows()[1], date, 50);
    component.openUpdateTemplateDialog();

    expect(templateServiceStub.updateTemplate).toHaveBeenCalledWith(7, {
      name: 'Focus Day',
      items: [
        { cost_center_id: 21, percentage: 50 },
        { cost_center_id: 22, percentage: 50 },
      ],
    });
  });

  it('should not open the save-template dialog for an empty day', () => {
    const fixture = TestBed.createComponent(TimeTrackingComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const snackBarOpenSpy = spyOn((component as never as { snackBar: MatSnackBar }).snackBar, 'open');

    component.openSaveTemplateDialog();

    expect(dialogStub.open).not.toHaveBeenCalled();
    expect(templateServiceStub.createTemplate).not.toHaveBeenCalled();
    expect(snackBarOpenSpy).toHaveBeenCalledWith('time_tracking.template_empty_day', 'common.ok', { duration: 3000 });
  });

  it('should not open the update-template dialog for an empty day', () => {
    const fixture = TestBed.createComponent(TimeTrackingComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const snackBarOpenSpy = spyOn((component as never as { snackBar: MatSnackBar }).snackBar, 'open');

    component.openUpdateTemplateDialog();

    expect(dialogStub.open).not.toHaveBeenCalled();
    expect(templateServiceStub.updateTemplate).not.toHaveBeenCalled();
    expect(snackBarOpenSpy).toHaveBeenCalledWith('time_tracking.template_empty_day', 'common.ok', { duration: 3000 });
  });

  it('should delete the selected template and remove it from the local state', () => {
    const fixture = TestBed.createComponent(TimeTrackingComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;

    component.deleteSelectedTemplate();

    expect(templateServiceStub.deleteTemplate).toHaveBeenCalledWith(7);
    expect(component.templates()).toEqual([]);
  });

  it('should copy the latest previously booked day into the selected target day', () => {
    const fixture = TestBed.createComponent(TimeTrackingComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const targetDate = component.selectedTemplateDate();
    const sourceDate = new Date(`${targetDate}T00:00:00`);
    sourceDate.setDate(sourceDate.getDate() - 1);
    const olderDate = new Date(`${targetDate}T00:00:00`);
    olderDate.setDate(olderDate.getDate() - 3);
    const sourceDateString = sourceDate.toISOString().split('T')[0];
    const olderDateString = olderDate.toISOString().split('T')[0];
    timeServiceStub.getTimeBookings.and.returnValue(of([
      { id: 1, user_id: 3, date: sourceDateString, cost_center_id: 21, percentage: 80, comment: null },
      { id: 2, user_id: 3, date: sourceDateString, cost_center_id: 22, percentage: 20, comment: null },
      { id: 3, user_id: 3, date: olderDateString, cost_center_id: 21, percentage: 100, comment: null },
    ]));

    component.copyPreviousDay();

    expect(timeServiceStub.getTimeBookings).toHaveBeenCalled();
    expect(component.bookingRows()[0].percentages[targetDate]).toBe(80);
    expect(component.bookingRows()[1].percentages[targetDate]).toBe(20);
  });

  it('should show a message when there is no previous booked day to copy', () => {
    const fixture = TestBed.createComponent(TimeTrackingComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const snackBarOpenSpy = spyOn((component as never as { snackBar: MatSnackBar }).snackBar, 'open');
    timeServiceStub.getTimeBookings.and.returnValue(of([]));

    component.copyPreviousDay();

    expect(snackBarOpenSpy).toHaveBeenCalledWith('time_tracking.copy_prev_day_empty', 'common.ok', { duration: 2500 });
  });

  it('should reduce the expected booking total to 50 percent on a half-day vacation', () => {
    const fixture = TestBed.createComponent(TimeTrackingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const targetDate = component.days().find(day => !day.isWeekend)?.date ?? component.days()[0].date;

    vacationServiceStub.getMyVacations.and.returnValue(of([
      {
        id: 9,
        user_id: 3,
        start_date: targetDate,
        end_date: targetDate,
        status: 'approved',
        comment: null,
        admin_comment: null,
        reviewed_by: 1,
        reviewed_at: '2026-04-01T12:00:00Z',
        workdays: 0.5,
        scope: 'morning',
        created_at: '2026-04-01T12:00:00Z',
      },
    ]));

    component['loadWeek']();
    const vacationDay = component.days().find(day => day.date === targetDate);

    expect(vacationServiceStub.getMyVacations).toHaveBeenCalled();
    expect(vacationDay?.vacation?.scope).toBe('morning');
    expect(vacationDay ? component.expectedDayTotal(vacationDay) : null).toBe(50);
  });

  it('should treat company holidays as locked days in the weekly grid', () => {
    const fixture = TestBed.createComponent(TimeTrackingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const targetDate = component.days().find(day => !day.isWeekend)?.date ?? component.days()[0].date;

    blackoutServiceStub.getMatchingBlackouts.and.returnValue(of([
      {
        id: 15,
        type: 'company_holiday',
        start_date: targetDate,
        end_date: targetDate,
        reason: 'Shutdown',
        created_at: '2026-04-01T12:00:00Z',
      },
    ]));

    component['loadWeek']();
    const holidayDay = component.days().find(day => day.date === targetDate);

    expect(blackoutServiceStub.getMatchingBlackouts).toHaveBeenCalled();
    expect(holidayDay?.companyHoliday?.type).toBe('company_holiday');
    expect(holidayDay ? component['canEditBookingsForDay'](holidayDay) : true).toBeFalse();
  });

  it('should exclude company holidays from weekly target and delta', () => {
    const fixture = TestBed.createComponent(TimeTrackingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const targetDate = component.days().find(day => !day.isWeekend)?.date ?? component.days()[0].date;

    blackoutServiceStub.getMatchingBlackouts.and.returnValue(of([
      {
        id: 15,
        type: 'company_holiday',
        start_date: targetDate,
        end_date: targetDate,
        reason: 'Shutdown',
        created_at: '2026-04-01T12:00:00Z',
      },
    ]));

    component['loadWeek']();

    expect(component.weekTarget()).toBe('32:00');
    expect(component.weekDelta()).toBe('-32:00');
  });

  it('should halve the weekly target for half-day absences', () => {
    const fixture = TestBed.createComponent(TimeTrackingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const targetDate = component.days().find(day => !day.isWeekend)?.date ?? component.days()[0].date;

    absenceServiceStub.getMyAbsences.and.returnValue(of([
      {
        id: 5,
        user_id: 3,
        start_date: targetDate,
        end_date: targetDate,
        type: 'illness',
        scope: 'morning',
        status: 'acknowledged',
        comment: null,
        admin_comment: null,
        reviewed_by: 1,
        reviewed_at: '2026-04-01T12:00:00Z',
        created_at: '2026-04-01T12:00:00Z',
      },
    ]));

    component['loadWeek']();

    expect(component.weekTarget()).toBe('36:00');
    expect(component.weekDelta()).toBe('-36:00');
  });

  it('should use the matching personal work schedule for weekly target and delta', () => {
    const fixture = TestBed.createComponent(TimeTrackingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const weekDays = component.days();
    const monday = weekDays[0].date;

    workScheduleServiceStub.getMyWorkSchedules.and.returnValue(of([
      {
        id: 11,
        user_id: 3,
        start_date: monday,
        end_date: null,
        work_days: [1, 2, 3, 4],
        weekly_target_minutes: 1920,
      },
    ]));

    component['loadWeek']();

    expect(workScheduleServiceStub.getMyWorkSchedules).toHaveBeenCalled();
    expect(component.weekTarget()).toBe('32:00');
    expect(component.weekDelta()).toBe('-32:00');
  });

  it('should load the work time account ledger and expose the current balance', () => {
    workTimeAccountServiceStub.getMyLedger.and.returnValue(of([
      {
        id: 1,
        user_id: 3,
        effective_date: '2026-04-01',
        type: 'worked',
        minutes_delta: 60,
        balance_after: 60,
        comment: 'Worked 540 min vs target 480 min',
        created_at: '2026-04-01T17:00:00Z',
        created_by: null,
        created_by_name: null,
        source_type: 'time_entry',
        source_id: 12,
      },
      {
        id: 2,
        user_id: 3,
        effective_date: '2026-04-02',
        type: 'manual_adjustment',
        minutes_delta: -30,
        balance_after: 30,
        comment: 'Correction',
        created_at: '2026-04-02T09:00:00Z',
        created_by: 1,
        created_by_name: 'Admin',
        source_type: 'manual',
        source_id: 2,
      },
    ]));

    const fixture = TestBed.createComponent(TimeTrackingComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;

    expect(workTimeAccountServiceStub.getMyLedger).toHaveBeenCalled();
    expect(component.workTimeLedger().length).toBe(2);
    expect(component.currentLedgerBalance()).toBe(30);
    expect(component.formatSignedMinutes(-30)).toBe('-0:30');
  });
});
