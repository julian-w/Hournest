import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { BlackoutService } from '../../../core/services/blackout.service';
import { BlackoutPeriod } from '../../../core/models/blackout-period.model';
import { AdminBlackoutsComponent } from './admin-blackouts.component';

describe('AdminBlackoutsComponent', () => {
  let blackoutServiceStub: {
    getBlackouts: jasmine.Spy;
    deleteBlackout: jasmine.Spy;
  };

  const blackouts: BlackoutPeriod[] = [
    {
      id: 1,
      type: 'freeze',
      start_date: '2026-07-01',
      end_date: '2026-07-15',
      reason: 'Quarter-end freeze',
      created_at: '2026-03-01T10:00:00Z',
    },
    {
      id: 2,
      type: 'company_holiday',
      start_date: '2026-12-24',
      end_date: '2026-12-31',
      reason: 'Company shutdown',
      created_at: '2026-03-02T10:00:00Z',
    },
  ];

  beforeEach(async () => {
    blackoutServiceStub = {
      getBlackouts: jasmine.createSpy('getBlackouts').and.returnValue(of(blackouts)),
      deleteBlackout: jasmine.createSpy('deleteBlackout').and.returnValue(of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [
        AdminBlackoutsComponent,
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
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  it('should load blackouts on init', () => {
    const fixture = TestBed.createComponent(AdminBlackoutsComponent);
    fixture.detectChanges();

    expect(blackoutServiceStub.getBlackouts).toHaveBeenCalled();
    expect(fixture.componentInstance.blackouts()).toEqual(blackouts);
    expect(fixture.nativeElement.textContent).toContain('Quarter-end freeze');
    expect(fixture.nativeElement.textContent).toContain('Company shutdown');
  });

  it('should open the create dialog and reload after a successful close', () => {
    const fixture = TestBed.createComponent(AdminBlackoutsComponent);
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

    blackoutServiceStub.getBlackouts.calls.reset();

    fixture.componentInstance.openDialog();

    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(blackoutServiceStub.getBlackouts).toHaveBeenCalled();
  });

  it('should open the edit dialog with blackout data and not reload when canceled', () => {
    const fixture = TestBed.createComponent(AdminBlackoutsComponent);
    fixture.detectChanges();
    const dialogOpenSpy = spyOn((fixture.componentInstance as never as { dialog: MatDialog }).dialog, 'open').and.returnValue({
      afterClosed: () => of(false),
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

    blackoutServiceStub.getBlackouts.calls.reset();

    fixture.componentInstance.editBlackout(blackouts[0]);

    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(blackoutServiceStub.getBlackouts).not.toHaveBeenCalled();
  });

  it('should delete a blackout, show feedback, and reload the list', () => {
    const fixture = TestBed.createComponent(AdminBlackoutsComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    blackoutServiceStub.getBlackouts.calls.reset();

    fixture.componentInstance.deleteBlackout(blackouts[1]);

    expect(blackoutServiceStub.deleteBlackout).toHaveBeenCalledWith(2);
    expect(snackBarOpenSpy).toHaveBeenCalledWith('admin_blackouts.deleted', 'common.ok', { duration: 3000 });
    expect(blackoutServiceStub.getBlackouts).toHaveBeenCalled();
  });
});
