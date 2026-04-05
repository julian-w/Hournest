import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AbsenceService } from '../../core/services/absence.service';
import { MyAbsencesComponent } from './my-absences.component';

describe('MyAbsencesComponent', () => {
  let absenceServiceStub: {
    getMyAbsences: jasmine.Spy;
    cancelAbsence: jasmine.Spy;
  };

  const absences = [
    {
      id: 4,
      user_id: 3,
      user_name: 'Employee User',
      start_date: '2026-04-07',
      end_date: '2026-04-07',
      type: 'illness' as const,
      scope: 'full_day' as const,
      status: 'reported' as const,
      comment: 'Flu',
      admin_comment: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: '2026-04-07T08:00:00Z',
    },
    {
      id: 5,
      user_id: 3,
      user_name: 'Employee User',
      start_date: '2026-04-10',
      end_date: '2026-04-10',
      type: 'special_leave' as const,
      scope: 'morning' as const,
      status: 'approved' as const,
      comment: null,
      admin_comment: null,
      reviewed_by: 1,
      reviewed_at: '2026-04-08T08:00:00Z',
      created_at: '2026-04-07T09:00:00Z',
    },
  ];

  beforeEach(async () => {
    absenceServiceStub = {
      getMyAbsences: jasmine.createSpy('getMyAbsences').and.returnValue(of(absences)),
      cancelAbsence: jasmine.createSpy('cancelAbsence').and.returnValue(of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [
        MyAbsencesComponent,
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
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  it('should load absences on init', () => {
    const fixture = TestBed.createComponent(MyAbsencesComponent);
    fixture.detectChanges();

    expect(absenceServiceStub.getMyAbsences).toHaveBeenCalled();
    expect(fixture.componentInstance.absences()).toEqual(absences);
    expect(fixture.nativeElement.textContent).toContain('Flu');
  });

  it('should reload after a successful report dialog', () => {
    const fixture = TestBed.createComponent(MyAbsencesComponent);
    fixture.detectChanges();
    const loadSpy = spyOn(fixture.componentInstance, 'load').and.callThrough();
    const dialogOpenSpy = spyOn((fixture.componentInstance as never as { dialog: MatDialog }).dialog, 'open')
      .and.returnValue({
        afterClosed: () => of(true),
      } as never);

    fixture.componentInstance.openReportDialog('illness');

    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it('should not reload after a cancelled report dialog', () => {
    const fixture = TestBed.createComponent(MyAbsencesComponent);
    fixture.detectChanges();
    const loadSpy = spyOn(fixture.componentInstance, 'load').and.callThrough();
    spyOn((fixture.componentInstance as never as { dialog: MatDialog }).dialog, 'open')
      .and.returnValue({
        afterClosed: () => of(false),
      } as never);

    fixture.componentInstance.openReportDialog('special_leave');

    expect(loadSpy).not.toHaveBeenCalled();
  });

  it('should cancel a reported absence and reload the list', () => {
    const fixture = TestBed.createComponent(MyAbsencesComponent);
    fixture.detectChanges();
    const loadSpy = spyOn(fixture.componentInstance, 'load').and.callThrough();

    fixture.componentInstance.cancelAbsence(absences[0]);

    expect(absenceServiceStub.cancelAbsence).toHaveBeenCalledWith(4);
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });
});
