import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { HolidayService } from '../../../core/services/holiday.service';
import { HolidayDateDialogComponent } from './holiday-date-dialog.component';

describe('HolidayDateDialogComponent', () => {
  let holidayServiceStub: {
    updateHolidayDate: jasmine.Spy;
  };
  let dialogRefStub: {
    close: jasmine.Spy;
  };

  beforeEach(async () => {
    holidayServiceStub = {
      updateHolidayDate: jasmine.createSpy('updateHolidayDate').and.returnValue(of({
        holiday_id: 4,
        name: 'Easter Monday',
        type: 'variable',
        year: 2026,
        date: '2026-04-06',
        confirmed: true,
      })),
    };

    dialogRefStub = {
      close: jasmine.createSpy('close'),
    };

    await TestBed.configureTestingModule({
      imports: [
        HolidayDateDialogComponent,
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
        { provide: MatDialogRef, useValue: dialogRefStub },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            holidayId: 4,
            name: 'Easter Monday',
            year: 2026,
            currentDate: null,
          },
        },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  function localDate(year: number, monthIndex: number, day: number): Date {
    return new Date(year, monthIndex, day, 12, 0, 0);
  }

  it('should not submit while the date is missing', () => {
    const fixture = TestBed.createComponent(HolidayDateDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.submit();

    expect(holidayServiceStub.updateHolidayDate).not.toHaveBeenCalled();
  });

  it('should submit a confirmed date and close the dialog', () => {
    const fixture = TestBed.createComponent(HolidayDateDialogComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    fixture.componentInstance.dateControl.setValue(localDate(2026, 3, 6));
    fixture.componentInstance.submit();

    expect(holidayServiceStub.updateHolidayDate).toHaveBeenCalledWith(4, 2026, '2026-04-06');
    expect(snackBarOpenSpy).toHaveBeenCalledWith('admin_holidays.updated', 'common.ok', { duration: 3000 });
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });

  it('should reset submitting when updating the date fails', () => {
    holidayServiceStub.updateHolidayDate.and.returnValue(throwError(() => new Error('update failed')));

    const fixture = TestBed.createComponent(HolidayDateDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.dateControl.setValue(localDate(2026, 3, 6));
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.submitting).toBeFalse();
    expect(dialogRefStub.close).not.toHaveBeenCalled();
  });
});
