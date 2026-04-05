import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { VacationLedgerEntry } from '../../../core/models/vacation-ledger-entry.model';
import { VacationLedgerService } from '../../../core/services/vacation-ledger.service';
import { LedgerAdjustmentDialogComponent } from './ledger-adjustment-dialog.component';

describe('LedgerAdjustmentDialogComponent', () => {
  let ledgerServiceStub: {
    getUserLedger: jasmine.Spy;
    addEntry: jasmine.Spy;
    deleteEntry: jasmine.Spy;
  };
  let dialogRefStub: {
    close: jasmine.Spy;
  };

  const initialEntries: VacationLedgerEntry[] = [
    {
      id: 1,
      user_id: 7,
      year: 2026,
      type: 'entitlement',
      days: 30,
      comment: 'Annual entitlement',
      vacation_id: null,
      created_at: '2026-01-01T10:00:00Z',
    },
    {
      id: 2,
      user_id: 7,
      year: 2026,
      type: 'taken',
      days: -5,
      comment: 'Trip',
      vacation_id: 12,
      created_at: '2026-02-01T10:00:00Z',
    },
  ];

  beforeEach(async () => {
    ledgerServiceStub = {
      getUserLedger: jasmine.createSpy('getUserLedger').and.returnValue(of(initialEntries)),
      addEntry: jasmine.createSpy('addEntry').and.returnValue(of(initialEntries[0])),
      deleteEntry: jasmine.createSpy('deleteEntry').and.returnValue(of(void 0)),
    };

    dialogRefStub = {
      close: jasmine.createSpy('close'),
    };

    await TestBed.configureTestingModule({
      imports: [
        LedgerAdjustmentDialogComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateNoOpLoader,
          },
        }),
      ],
      providers: [
        { provide: VacationLedgerService, useValue: ledgerServiceStub },
        { provide: MatDialogRef, useValue: dialogRefStub },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
        { provide: MAT_DIALOG_DATA, useValue: { userId: 7, userName: 'Ada Lovelace' } },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  it('should load entries with a running balance on init', () => {
    const fixture = TestBed.createComponent(LedgerAdjustmentDialogComponent);
    fixture.detectChanges();

    expect(ledgerServiceStub.getUserLedger).toHaveBeenCalledWith(7, new Date().getFullYear());
    expect(fixture.componentInstance.entries().map((entry) => entry.running_balance)).toEqual([30, 25]);
    expect(fixture.componentInstance.balance()).toBe(25);
  });

  it('should only allow adding entries with days and a comment', () => {
    const fixture = TestBed.createComponent(LedgerAdjustmentDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.newDays = 0;
    fixture.componentInstance.newComment = '  ';
    expect(fixture.componentInstance.canAdd()).toBeFalse();

    fixture.componentInstance.newDays = 2;
    fixture.componentInstance.newComment = 'Bonus days';
    expect(fixture.componentInstance.canAdd()).toBeTrue();
  });

  it('should add a manual entry, reset the form, and reload the ledger', () => {
    const fixture = TestBed.createComponent(LedgerAdjustmentDialogComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    ledgerServiceStub.getUserLedger.calls.reset();
    fixture.componentInstance.newType = 'bonus';
    fixture.componentInstance.newDays = 3;
    fixture.componentInstance.newComment = '  Bonus days  ';

    fixture.componentInstance.addEntry();

    expect(ledgerServiceStub.addEntry).toHaveBeenCalledWith(7, {
      year: new Date().getFullYear(),
      type: 'bonus',
      days: 3,
      comment: 'Bonus days',
    });
    expect(fixture.componentInstance.changed).toBeTrue();
    expect(fixture.componentInstance.newDays).toBe(0);
    expect(fixture.componentInstance.newComment).toBe('');
    expect(snackBarOpenSpy).toHaveBeenCalledWith('admin_users.ledger_updated', 'common.ok', { duration: 2000 });
    expect(ledgerServiceStub.getUserLedger).toHaveBeenCalled();
  });

  it('should delete an entry, show feedback, and reload the ledger', () => {
    const fixture = TestBed.createComponent(LedgerAdjustmentDialogComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    ledgerServiceStub.getUserLedger.calls.reset();
    fixture.componentInstance.deleteEntry(initialEntries[0]);

    expect(ledgerServiceStub.deleteEntry).toHaveBeenCalledWith(7, 1);
    expect(fixture.componentInstance.changed).toBeTrue();
    expect(snackBarOpenSpy).toHaveBeenCalledWith('ledger_dialog.entry_deleted', 'common.ok', { duration: 2000 });
    expect(ledgerServiceStub.getUserLedger).toHaveBeenCalled();
  });
});
