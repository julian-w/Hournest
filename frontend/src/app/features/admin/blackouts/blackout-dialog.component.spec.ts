import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { BlackoutPeriod } from '../../../core/models/blackout-period.model';
import { BlackoutService } from '../../../core/services/blackout.service';
import { BlackoutDialogComponent } from './blackout-dialog.component';

describe('BlackoutDialogComponent', () => {
  let blackoutServiceStub: {
    createBlackout: jasmine.Spy;
    updateBlackout: jasmine.Spy;
  };
  let dialogRefStub: {
    close: jasmine.Spy;
  };
  let snackBarStub: {
    open: jasmine.Spy;
  };

  const existingBlackout: BlackoutPeriod = {
    id: 9,
    type: 'company_holiday',
    start_date: '2026-12-24',
    end_date: '2026-12-31',
    reason: 'Winter shutdown',
    created_at: '2026-01-01T00:00:00Z',
  };

  async function configure(data: BlackoutPeriod | null): Promise<void> {
    await TestBed.resetTestingModule();

    blackoutServiceStub = {
      createBlackout: jasmine.createSpy('createBlackout').and.returnValue(of(existingBlackout)),
      updateBlackout: jasmine.createSpy('updateBlackout').and.returnValue(of(existingBlackout)),
    };

    dialogRefStub = {
      close: jasmine.createSpy('close'),
    };

    snackBarStub = {
      open: jasmine.createSpy('open'),
    };

    await TestBed.configureTestingModule({
      imports: [
        BlackoutDialogComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateNoOpLoader,
          },
        }),
      ],
      providers: [
        { provide: BlackoutService, useValue: blackoutServiceStub },
        { provide: MatDialogRef, useValue: dialogRefStub },
        { provide: MatSnackBar, useValue: snackBarStub },
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

  it('should initialize the edit form from dialog data', async () => {
    await configure(existingBlackout);
    const fixture = TestBed.createComponent(BlackoutDialogComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.isEdit).toBeTrue();
    expect(fixture.componentInstance.form.value.type).toBe('company_holiday');
    expect(fixture.componentInstance.form.value.reason).toBe('Winter shutdown');
  });

  it('should create a blackout and close the dialog', async () => {
    await configure(null);
    const fixture = TestBed.createComponent(BlackoutDialogComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    fixture.componentInstance.form.patchValue({
      type: 'freeze',
      startDate: localDate(2026, 10, 2),
      endDate: localDate(2026, 10, 5),
      reason: 'Busy release week',
    });

    fixture.componentInstance.submit();

    expect(blackoutServiceStub.createBlackout).toHaveBeenCalledWith({
      type: 'freeze',
      start_date: '2026-11-02',
      end_date: '2026-11-05',
      reason: 'Busy release week',
    });
    expect(snackBarOpenSpy).toHaveBeenCalledWith('admin_blackouts.created', 'common.ok', { duration: 3000 });
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });

  it('should update an existing blackout and close the dialog', async () => {
    await configure(existingBlackout);
    const fixture = TestBed.createComponent(BlackoutDialogComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    fixture.componentInstance.form.patchValue({
      reason: 'Updated shutdown',
      startDate: localDate(2026, 11, 24),
      endDate: localDate(2026, 11, 30),
    });

    fixture.componentInstance.submit();

    expect(blackoutServiceStub.updateBlackout).toHaveBeenCalledWith(9, {
      type: 'company_holiday',
      start_date: '2026-12-24',
      end_date: '2026-12-30',
      reason: 'Updated shutdown',
    });
    expect(snackBarOpenSpy).toHaveBeenCalledWith('admin_blackouts.updated', 'common.ok', { duration: 3000 });
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });

  it('should reset submitting when create fails', async () => {
    await configure(null);
    blackoutServiceStub.createBlackout.and.returnValue(throwError(() => new Error('create failed')));

    const fixture = TestBed.createComponent(BlackoutDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      type: 'freeze',
      startDate: localDate(2026, 10, 2),
      endDate: localDate(2026, 10, 5),
      reason: 'Busy release week',
    });

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.submitting).toBeFalse();
    expect(dialogRefStub.close).not.toHaveBeenCalled();
  });
});
