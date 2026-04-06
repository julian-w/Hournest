import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { Absence } from '../../../core/models/absence.model';
import { AdminAbsencesComponent } from './admin-absences.component';

describe('AdminAbsencesComponent', () => {
  let adminServiceStub: {
    getAbsences: jasmine.Spy;
    reviewAbsence: jasmine.Spy;
    deleteAbsence: jasmine.Spy;
  };

  const absences: Absence[] = [
    {
      id: 1,
      user_id: 3,
      user_name: 'Sick Employee',
      start_date: '2026-04-10',
      end_date: '2026-04-10',
      type: 'illness',
      scope: 'full_day',
      status: 'reported',
      comment: 'Flu',
      admin_comment: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: '2026-04-10T08:00:00Z',
    },
    {
      id: 2,
      user_id: 4,
      user_name: 'Special Leave User',
      start_date: '2026-04-11',
      end_date: '2026-04-11',
      type: 'special_leave',
      scope: 'morning',
      status: 'pending',
      comment: 'Family appointment',
      admin_comment: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: '2026-04-10T09:00:00Z',
    },
    {
      id: 3,
      user_id: 5,
      user_name: 'Approved User',
      start_date: '2026-04-08',
      end_date: '2026-04-08',
      type: 'special_leave',
      scope: 'afternoon',
      status: 'approved',
      comment: null,
      admin_comment: 'Approved',
      reviewed_by: 1,
      reviewed_at: '2026-04-08T11:00:00Z',
      created_at: '2026-04-07T09:00:00Z',
    },
  ];

  beforeEach(async () => {
    adminServiceStub = {
      getAbsences: jasmine.createSpy('getAbsences').and.returnValue(of(absences)),
      reviewAbsence: jasmine.createSpy('reviewAbsence').and.returnValue(of({
        ...absences[0],
        status: 'acknowledged',
      })),
      deleteAbsence: jasmine.createSpy('deleteAbsence').and.returnValue(of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [
        AdminAbsencesComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateNoOpLoader,
          },
        }),
      ],
      providers: [
        { provide: AdminService, useValue: adminServiceStub },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  it('should load and filter pending absences on init', () => {
    const fixture = TestBed.createComponent(AdminAbsencesComponent);
    fixture.detectChanges();

    expect(adminServiceStub.getAbsences).toHaveBeenCalled();
    expect(fixture.componentInstance.pendingAbsences().map(a => a.id)).toEqual([1, 2]);
    expect(fixture.nativeElement.textContent).toContain('Sick Employee');
    expect(fixture.nativeElement.textContent).toContain('Special Leave User');
  });

  it('should load all absences when switching to the all tab', () => {
    const fixture = TestBed.createComponent(AdminAbsencesComponent);
    fixture.detectChanges();

    adminServiceStub.getAbsences.calls.reset();
    fixture.componentInstance.onTabChange(1);

    expect(adminServiceStub.getAbsences).toHaveBeenCalled();
    expect(fixture.componentInstance.allAbsences().map(a => a.id)).toEqual([1, 2, 3]);
  });

  it('should review an absence, show feedback, and reload pending absences', () => {
    const fixture = TestBed.createComponent(AdminAbsencesComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    adminServiceStub.getAbsences.calls.reset();
    fixture.componentInstance.reviewAbsence(absences[0], 'acknowledged');

    expect(adminServiceStub.reviewAbsence).toHaveBeenCalledWith(1, 'acknowledged');
    expect(snackBarOpenSpy).toHaveBeenCalledWith('admin_absences.reviewed', 'common.ok', { duration: 3000 });
    expect(adminServiceStub.getAbsences).toHaveBeenCalled();
  });

  it('should delete an absence, show feedback, and reload all absences', () => {
    const fixture = TestBed.createComponent(AdminAbsencesComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    adminServiceStub.getAbsences.calls.reset();
    fixture.componentInstance.deleteAbsence(absences[2]);

    expect(adminServiceStub.deleteAbsence).toHaveBeenCalledWith(3);
    expect(snackBarOpenSpy).toHaveBeenCalledWith('admin_absences.deleted', 'common.ok', { duration: 3000 });
    expect(adminServiceStub.getAbsences).toHaveBeenCalled();
  });

  it('should show backend feedback when reviewing an absence fails', () => {
    adminServiceStub.reviewAbsence.and.returnValue(throwError(() => ({
      error: {
        message: 'Invalid status transition.',
      },
    })));

    const fixture = TestBed.createComponent(AdminAbsencesComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    fixture.componentInstance.reviewAbsence(absences[1], 'approved');

    expect(snackBarOpenSpy).toHaveBeenCalledWith('Invalid status transition.', 'common.ok', { duration: 3000 });
  });

  it('should open the create dialog and reload both lists after a successful close', () => {
    const fixture = TestBed.createComponent(AdminAbsencesComponent);
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

    adminServiceStub.getAbsences.calls.reset();
    fixture.componentInstance.openCreateDialog();

    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(adminServiceStub.getAbsences).toHaveBeenCalledTimes(2);
  });
});
