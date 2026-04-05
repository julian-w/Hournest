import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { Holiday } from '../../../core/models/holiday.model';
import { HolidayService } from '../../../core/services/holiday.service';
import { HolidayDialogComponent } from './holiday-dialog.component';

describe('HolidayDialogComponent', () => {
  let holidayServiceStub: {
    createHoliday: jasmine.Spy;
    updateHoliday: jasmine.Spy;
  };
  let dialogRefStub: {
    close: jasmine.Spy;
  };

  const existingHoliday: Holiday = {
    id: 4,
    name: 'Easter Monday',
    date: '2026-04-06',
    type: 'variable',
    start_year: 2026,
    end_year: null,
  };

  async function configure(data: { year: number; holiday?: Holiday }): Promise<void> {
    await TestBed.resetTestingModule();

    holidayServiceStub = {
      createHoliday: jasmine.createSpy('createHoliday').and.returnValue(of(existingHoliday)),
      updateHoliday: jasmine.createSpy('updateHoliday').and.returnValue(of(existingHoliday)),
    };

    dialogRefStub = {
      close: jasmine.createSpy('close'),
    };

    await TestBed.configureTestingModule({
      imports: [
        HolidayDialogComponent,
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
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  }

  function localDate(year: number, monthIndex: number, day: number): Date {
    return new Date(year, monthIndex, day, 12, 0, 0);
  }

  it('should initialize edit mode from dialog data', async () => {
    await configure({ year: 2026, holiday: existingHoliday });
    const fixture = TestBed.createComponent(HolidayDialogComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.isEdit).toBeTrue();
    expect(fixture.componentInstance.form.value.name).toBe('Easter Monday');
    expect(fixture.componentInstance.form.value.type).toBe('variable');
    expect(fixture.componentInstance.form.value.start_year).toBe(2026);
  });

  it('should create a holiday and close the dialog', async () => {
    await configure({ year: 2026 });
    const fixture = TestBed.createComponent(HolidayDialogComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    fixture.componentInstance.form.patchValue({
      name: 'New Year',
      date: localDate(2026, 0, 1),
      type: 'fixed',
      start_year: 2026,
      end_year: 2028,
    });

    fixture.componentInstance.submit();

    expect(holidayServiceStub.createHoliday).toHaveBeenCalledWith({
      name: 'New Year',
      date: '2026-01-01',
      type: 'fixed',
      start_year: 2026,
      end_year: 2028,
    });
    expect(snackBarOpenSpy).toHaveBeenCalledWith('admin_holidays.created', 'common.ok', { duration: 3000 });
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });

  it('should update an existing holiday and close the dialog', async () => {
    await configure({ year: 2026, holiday: existingHoliday });
    const fixture = TestBed.createComponent(HolidayDialogComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    fixture.componentInstance.form.patchValue({
      name: 'Easter Monday Updated',
      date: localDate(2026, 3, 7),
      type: 'variable',
      start_year: 2025,
      end_year: null,
    });

    fixture.componentInstance.submit();

    expect(holidayServiceStub.updateHoliday).toHaveBeenCalledWith(4, {
      name: 'Easter Monday Updated',
      date: '2026-04-07',
      type: 'variable',
      start_year: 2025,
      end_year: null,
    });
    expect(snackBarOpenSpy).toHaveBeenCalledWith('admin_holidays.updated', 'common.ok', { duration: 3000 });
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });

  it('should reset submitting when the request fails', async () => {
    await configure({ year: 2026 });
    holidayServiceStub.createHoliday.and.returnValue(throwError(() => new Error('create failed')));

    const fixture = TestBed.createComponent(HolidayDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      name: 'New Year',
      date: localDate(2026, 0, 1),
      type: 'fixed',
      start_year: 2026,
      end_year: null,
    });

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.submitting).toBeFalse();
    expect(dialogRefStub.close).not.toHaveBeenCalled();
  });
});
