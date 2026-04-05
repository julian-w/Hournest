import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AbsenceService } from '../../core/services/absence.service';
import { ReportAbsenceDialogComponent } from './my-absences.component';

describe('ReportAbsenceDialogComponent', () => {
  let absenceServiceStub: {
    reportAbsence: jasmine.Spy;
  };
  let dialogRefStub: {
    close: jasmine.Spy;
  };

  function localDate(year: number, monthIndex: number, day: number): Date {
    return new Date(year, monthIndex, day, 12, 0, 0);
  }

  beforeEach(async () => {
    absenceServiceStub = {
      reportAbsence: jasmine.createSpy('reportAbsence').and.returnValue(of({
        id: 8,
        user_id: 5,
        start_date: '2026-04-10',
        end_date: '2026-04-10',
        type: 'special_leave',
        scope: 'morning',
        status: 'pending',
        comment: 'Wedding',
        admin_comment: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: '2026-04-01T10:00:00Z',
      })),
    };

    dialogRefStub = {
      close: jasmine.createSpy('close'),
    };

    await TestBed.configureTestingModule({
      imports: [
        ReportAbsenceDialogComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateNoOpLoader,
          },
        }),
      ],
      providers: [
        { provide: AbsenceService, useValue: absenceServiceStub },
        { provide: MatDialogRef, useValue: dialogRefStub },
        { provide: MAT_DIALOG_DATA, useValue: 'special_leave' },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  it('should not save without both dates', () => {
    const fixture = TestBed.createComponent(ReportAbsenceDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.startDate = localDate(2026, 3, 10);
    fixture.componentInstance.endDate = null;

    fixture.componentInstance.save();

    expect(absenceServiceStub.reportAbsence).not.toHaveBeenCalled();
    expect(dialogRefStub.close).not.toHaveBeenCalled();
  });

  it('should submit the absence payload and close the dialog', () => {
    const fixture = TestBed.createComponent(ReportAbsenceDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.scope = 'morning';
    fixture.componentInstance.comment = 'Family event';
    fixture.componentInstance.startDate = localDate(2026, 3, 10);
    fixture.componentInstance.endDate = localDate(2026, 3, 10);

    fixture.componentInstance.save();

    expect(absenceServiceStub.reportAbsence).toHaveBeenCalledWith({
      start_date: '2026-04-10',
      end_date: '2026-04-10',
      type: 'special_leave',
      scope: 'morning',
      comment: 'Family event',
    });
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });

  it('should omit the comment when it is empty', () => {
    const fixture = TestBed.createComponent(ReportAbsenceDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.scope = 'full_day';
    fixture.componentInstance.comment = '';
    fixture.componentInstance.startDate = localDate(2026, 3, 10);
    fixture.componentInstance.endDate = localDate(2026, 3, 11);

    fixture.componentInstance.save();

    expect(absenceServiceStub.reportAbsence).toHaveBeenCalledWith({
      start_date: '2026-04-10',
      end_date: '2026-04-11',
      type: 'special_leave',
      scope: 'full_day',
      comment: undefined,
    });
  });
});
