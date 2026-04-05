import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { HolidayService } from '../../../core/services/holiday.service';
import { Holiday, HolidayInstance } from '../../../core/models/holiday.model';
import { AdminHolidaysComponent } from './admin-holidays.component';

describe('AdminHolidaysComponent', () => {
  let holidayServiceStub: {
    getHolidayInstances: jasmine.Spy;
    getHolidays: jasmine.Spy;
    deleteHoliday: jasmine.Spy;
  };

  const currentYear = new Date().getFullYear();

  const instances: HolidayInstance[] = [
    {
      holiday_id: 1,
      name: 'New Year',
      type: 'fixed',
      year: currentYear,
      date: `${currentYear}-01-01`,
      confirmed: true,
    },
    {
      holiday_id: 2,
      name: 'Easter Monday',
      type: 'variable',
      year: currentYear,
      date: null,
      confirmed: false,
    },
  ];

  const holidays: Holiday[] = [
    {
      id: 1,
      name: 'New Year',
      date: '2026-01-01',
      type: 'fixed',
      start_year: 2020,
      end_year: null,
    },
    {
      id: 2,
      name: 'Easter Monday',
      date: '',
      type: 'variable',
      start_year: 2020,
      end_year: null,
    },
  ];

  beforeEach(async () => {
    holidayServiceStub = {
      getHolidayInstances: jasmine.createSpy('getHolidayInstances').and.returnValue(of(instances)),
      getHolidays: jasmine.createSpy('getHolidays').and.returnValue(of(holidays)),
      deleteHoliday: jasmine.createSpy('deleteHoliday').and.returnValue(of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [
        AdminHolidaysComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateNoOpLoader,
          },
        }),
      ],
      providers: [
        { provide: HolidayService, useValue: holidayServiceStub },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  it('should load holiday instances on init and compute pending state', () => {
    const fixture = TestBed.createComponent(AdminHolidaysComponent);
    fixture.detectChanges();

    expect(holidayServiceStub.getHolidayInstances).toHaveBeenCalledWith(currentYear);
    expect(fixture.componentInstance.instances()).toEqual(instances);
    expect(fixture.componentInstance.allConfirmed()).toBeFalse();
    expect(fixture.componentInstance.pendingCount()).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Easter Monday');
  });

  it('should reload instances when the year changes', () => {
    const fixture = TestBed.createComponent(AdminHolidaysComponent);
    fixture.detectChanges();

    holidayServiceStub.getHolidayInstances.calls.reset();

    fixture.componentInstance.onYearChange(currentYear + 1);

    expect(fixture.componentInstance.selectedYear()).toBe(currentYear + 1);
    expect(holidayServiceStub.getHolidayInstances).toHaveBeenCalledWith(currentYear + 1);
  });

  it('should open the create dialog and reload after a successful close', () => {
    const fixture = TestBed.createComponent(AdminHolidaysComponent);
    fixture.detectChanges();
    const dialogOpenSpy = spyOn((fixture.componentInstance as never as { dialog: MatDialog }).dialog, 'open').and.returnValue({
      afterClosed: () => of(true),
      componentInstance: {},
      componentRef: null,
      disableClose: false,
      id: 'dialog',
      keydownEvents: () => new EventEmitter<KeyboardEvent>(),
      backdropClick: () => new EventEmitter<MouseEvent>(),
      beforeClosed: () => of(undefined),
      close: () => undefined,
      updatePosition: () => undefined,
      updateSize: () => undefined,
      addPanelClass: () => undefined,
      removePanelClass: () => undefined,
      afterOpened: () => of(undefined),
      getState: () => 0,
    } as never);

    holidayServiceStub.getHolidayInstances.calls.reset();

    fixture.componentInstance.openCreateDialog();

    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(holidayServiceStub.getHolidayInstances).toHaveBeenCalledWith(currentYear);
  });

  it('should fetch base holidays before opening the edit dialog and reload on success', () => {
    const fixture = TestBed.createComponent(AdminHolidaysComponent);
    fixture.detectChanges();
    const dialogOpenSpy = spyOn((fixture.componentInstance as never as { dialog: MatDialog }).dialog, 'open').and.returnValue({
      afterClosed: () => of(true),
      componentInstance: {},
      componentRef: null,
      disableClose: false,
      id: 'dialog',
      keydownEvents: () => new EventEmitter<KeyboardEvent>(),
      backdropClick: () => new EventEmitter<MouseEvent>(),
      beforeClosed: () => of(undefined),
      close: () => undefined,
      updatePosition: () => undefined,
      updateSize: () => undefined,
      addPanelClass: () => undefined,
      removePanelClass: () => undefined,
      afterOpened: () => of(undefined),
      getState: () => 0,
    } as never);

    holidayServiceStub.getHolidayInstances.calls.reset();

    fixture.componentInstance.openEditDialog(instances[1]);

    expect(holidayServiceStub.getHolidays).toHaveBeenCalled();
    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(holidayServiceStub.getHolidayInstances).toHaveBeenCalledWith(currentYear);
  });

  it('should delete a holiday, show feedback, and reload instances', () => {
    const fixture = TestBed.createComponent(AdminHolidaysComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    holidayServiceStub.getHolidayInstances.calls.reset();

    fixture.componentInstance.deleteHoliday(instances[1]);

    expect(holidayServiceStub.deleteHoliday).toHaveBeenCalledWith(2);
    expect(snackBarOpenSpy).toHaveBeenCalledWith('admin_holidays.deleted', 'common.ok', { duration: 3000 });
    expect(holidayServiceStub.getHolidayInstances).toHaveBeenCalledWith(currentYear);
  });
});
