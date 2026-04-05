import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { WorkTimeAccountEntry } from '../../../core/models/work-time-account-entry.model';
import { WorkTimeAccountService } from '../../../core/services/work-time-account.service';
import { TimeAccountAdjustmentDialogComponent } from './time-account-adjustment-dialog.component';

describe('TimeAccountAdjustmentDialogComponent', () => {
  let workTimeAccountServiceStub: {
    getUserLedger: jasmine.Spy;
    addEntry: jasmine.Spy;
    deleteEntry: jasmine.Spy;
  };
  let dialogRefStub: {
    close: jasmine.Spy;
  };

  const initialEntries: WorkTimeAccountEntry[] = [
    {
      id: 1,
      user_id: 8,
      effective_date: '2026-01-01',
      type: 'opening_balance',
      minutes_delta: 120,
      balance_after: 120,
      comment: 'Opening balance',
      created_at: '2026-01-01T08:00:00Z',
      created_by: null,
      created_by_name: null,
      source_type: 'opening_balance',
      source_id: null,
    },
    {
      id: 2,
      user_id: 8,
      effective_date: '2026-01-03',
      type: 'manual_adjustment',
      minutes_delta: -30,
      balance_after: 90,
      comment: 'Correction',
      created_at: '2026-01-03T08:00:00Z',
      created_by: 1,
      created_by_name: 'Admin',
      source_type: 'manual',
      source_id: 22,
    },
  ];

  beforeEach(async () => {
    workTimeAccountServiceStub = {
      getUserLedger: jasmine.createSpy('getUserLedger').and.returnValue(of(initialEntries)),
      addEntry: jasmine.createSpy('addEntry').and.returnValue(of(initialEntries[1])),
      deleteEntry: jasmine.createSpy('deleteEntry').and.returnValue(of(void 0)),
    };

    dialogRefStub = {
      close: jasmine.createSpy('close'),
    };

    await TestBed.configureTestingModule({
      imports: [
        TimeAccountAdjustmentDialogComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateNoOpLoader,
          },
        }),
      ],
      providers: [
        { provide: WorkTimeAccountService, useValue: workTimeAccountServiceStub },
        { provide: MatDialogRef, useValue: dialogRefStub },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
        { provide: MAT_DIALOG_DATA, useValue: { userId: 8, userName: 'Grace Hopper' } },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  it('should load the ledger and use the last entry balance on init', () => {
    const fixture = TestBed.createComponent(TimeAccountAdjustmentDialogComponent);
    fixture.detectChanges();

    expect(workTimeAccountServiceStub.getUserLedger).toHaveBeenCalledWith(8, new Date().getFullYear());
    expect(fixture.componentInstance.entries()).toEqual(initialEntries);
    expect(fixture.componentInstance.balance()).toBe(90);
  });

  it('should require date, delta, and comment before adding an entry', () => {
    const fixture = TestBed.createComponent(TimeAccountAdjustmentDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.newEffectiveDate = '';
    fixture.componentInstance.newMinutesDelta = 0;
    fixture.componentInstance.newComment = '  ';
    expect(fixture.componentInstance.canAdd()).toBeFalse();

    fixture.componentInstance.newEffectiveDate = '2026-03-10';
    fixture.componentInstance.newMinutesDelta = 45;
    fixture.componentInstance.newComment = 'Carryover';
    expect(fixture.componentInstance.canAdd()).toBeTrue();
  });

  it('should add an entry, reset the input fields, and reload the ledger', () => {
    const fixture = TestBed.createComponent(TimeAccountAdjustmentDialogComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    workTimeAccountServiceStub.getUserLedger.calls.reset();
    fixture.componentInstance.newEffectiveDate = '2026-03-10';
    fixture.componentInstance.newType = 'carryover';
    fixture.componentInstance.newMinutesDelta = 45;
    fixture.componentInstance.newComment = '  Carryover  ';

    fixture.componentInstance.addEntry();

    expect(workTimeAccountServiceStub.addEntry).toHaveBeenCalledWith(8, {
      effective_date: '2026-03-10',
      type: 'carryover',
      minutes_delta: 45,
      comment: 'Carryover',
    });
    expect(fixture.componentInstance.changed).toBeTrue();
    expect(fixture.componentInstance.newMinutesDelta).toBe(0);
    expect(fixture.componentInstance.newComment).toBe('');
    expect(snackBarOpenSpy).toHaveBeenCalledWith('time_tracking.account.updated', 'common.ok', { duration: 2000 });
    expect(workTimeAccountServiceStub.getUserLedger).toHaveBeenCalled();
  });

  it('should skip deletion when the entry id is not numeric', () => {
    const fixture = TestBed.createComponent(TimeAccountAdjustmentDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.deleteEntry({
      ...initialEntries[1],
      id: 'manual-1',
    });

    expect(workTimeAccountServiceStub.deleteEntry).not.toHaveBeenCalled();
  });

  it('should delete numeric manual entries and reload the ledger', () => {
    const fixture = TestBed.createComponent(TimeAccountAdjustmentDialogComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    workTimeAccountServiceStub.getUserLedger.calls.reset();
    fixture.componentInstance.deleteEntry(initialEntries[1]);

    expect(workTimeAccountServiceStub.deleteEntry).toHaveBeenCalledWith(8, 2);
    expect(fixture.componentInstance.changed).toBeTrue();
    expect(snackBarOpenSpy).toHaveBeenCalledWith('time_tracking.account.updated', 'common.ok', { duration: 2000 });
    expect(workTimeAccountServiceStub.getUserLedger).toHaveBeenCalled();
  });

  it('should format signed minutes consistently', () => {
    const fixture = TestBed.createComponent(TimeAccountAdjustmentDialogComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.formatSignedMinutes(75)).toBe('+1:15');
    expect(fixture.componentInstance.formatSignedMinutes(-90)).toBe('-1:30');
    expect(fixture.componentInstance.formatSignedMinutes(0)).toBe('0:00');
  });
});
