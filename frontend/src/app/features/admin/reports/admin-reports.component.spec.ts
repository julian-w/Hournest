import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { AdminReportsComponent } from './admin-reports.component';

describe('AdminReportsComponent', () => {
  let adminServiceStub: {
    getUsers: jasmine.Spy;
    getTimeBookingReport: jasmine.Spy;
    getMissingEntriesReport: jasmine.Spy;
    getAbsenceReport: jasmine.Spy;
    exportTimeBookingsCsv: jasmine.Spy;
  };
  let snackBarStub: {
    open: jasmine.Spy;
  };

  beforeEach(async () => {
    adminServiceStub = {
      getUsers: jasmine.createSpy('getUsers').and.returnValue(of([
        {
          id: 9,
          email: 'ada@example.com',
          display_name: 'Ada Lovelace',
          role: 'employee',
          vacation_days_per_year: 30,
          remaining_vacation_days: 22,
          holidays_exempt: false,
          weekend_worker: false,
        },
        {
          id: 1,
          email: 'admin@example.com',
          display_name: 'Admin User',
          role: 'admin',
          vacation_days_per_year: 30,
          remaining_vacation_days: 30,
          holidays_exempt: false,
          weekend_worker: false,
        },
      ])),
      getTimeBookingReport: jasmine.createSpy('getTimeBookingReport').and.returnValue(of([
        {
          group_by: 'user',
          group_key: 9,
          label: 'Ada Lovelace',
          code: null,
          percentage_points: 100,
          booked_minutes: 480,
        },
      ])),
      getMissingEntriesReport: jasmine.createSpy('getMissingEntriesReport').and.returnValue(of([
        {
          user_id: 9,
          user_name: 'Ada Lovelace',
          date: '2026-04-07',
          reason: 'incomplete_booking',
          expected_percentage: 100,
          actual_percentage: 60,
          has_time_entry: true,
        },
      ])),
      getAbsenceReport: jasmine.createSpy('getAbsenceReport').and.returnValue(of([
        {
          id: 17,
          user_id: 9,
          user_name: 'Ada Lovelace',
          type: 'special_leave',
          scope: 'morning',
          status: 'approved',
          start_date: '2026-04-07',
          end_date: '2026-04-07',
          comment: 'Family event',
          admin_comment: 'Approved',
        },
      ])),
      exportTimeBookingsCsv: jasmine.createSpy('exportTimeBookingsCsv').and.returnValue(
        of(new Blob(['csv'], { type: 'text/csv' })),
      ),
    };

    snackBarStub = {
      open: jasmine.createSpy('open'),
    };

    await TestBed.configureTestingModule({
      imports: [
        AdminReportsComponent,
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
        { provide: MatSnackBar, useValue: snackBarStub },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  it('should load summary, missing entry, and absence reports on init', () => {
    const fixture = TestBed.createComponent(AdminReportsComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;

    expect(adminServiceStub.getTimeBookingReport).toHaveBeenCalled();
    expect(adminServiceStub.getMissingEntriesReport).toHaveBeenCalled();
    expect(adminServiceStub.getAbsenceReport).toHaveBeenCalled();
    expect(adminServiceStub.getUsers).toHaveBeenCalled();
    expect(component.timeBookingRows()[0].label).toBe('Ada Lovelace');
    expect(component.missingEntries()[0].reason).toBe('incomplete_booking');
    expect(component.absences()[0].type).toBe('special_leave');
    expect(component.employees().length).toBe(1);
  });

  it('should render the absence report table when absence rows are present', () => {
    const fixture = TestBed.createComponent(AdminReportsComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('admin_reports.absence_report');
    expect(element.textContent).toContain('Ada Lovelace');
    expect(element.textContent).toContain('admin_absences.type_special_leave');
    expect(element.textContent).toContain('admin_absences.status_approved');
  });

  it('should reload the summary when the grouping changes', () => {
    const fixture = TestBed.createComponent(AdminReportsComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.groupBy = 'cost_center';
    component.loadReports();

    expect(adminServiceStub.getTimeBookingReport).toHaveBeenCalledWith(component.from, component.to, 'cost_center');
  });

  it('should pass absence filters to the absence report request', () => {
    const fixture = TestBed.createComponent(AdminReportsComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.absenceUserId = 9;
    component.absenceType = 'special_leave';
    component.absenceStatus = 'approved';

    component.loadReports();

    expect(adminServiceStub.getAbsenceReport).toHaveBeenCalledWith(component.from, component.to, {
      user_id: 9,
      type: 'special_leave',
      status: 'approved',
    });
  });

  it('should reset absence filters and reload reports', () => {
    const fixture = TestBed.createComponent(AdminReportsComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.absenceUserId = 9;
    component.absenceType = 'special_leave';
    component.absenceStatus = 'approved';

    component.resetAbsenceFilters();

    expect(component.absenceUserId).toBeNull();
    expect(component.absenceType).toBeNull();
    expect(component.absenceStatus).toBeNull();
    expect(adminServiceStub.getAbsenceReport).toHaveBeenCalledWith(component.from, component.to, {});
  });

  it('should export the selected period as csv and show a snackbar', () => {
    const fixture = TestBed.createComponent(AdminReportsComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const snackBarOpenSpy = spyOn((component as never as { snackBar: MatSnackBar }).snackBar, 'open');
    const createObjectUrlSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:mock');
    const revokeObjectUrlSpy = spyOn(URL, 'revokeObjectURL');
    const clickSpy = jasmine.createSpy('click');
    const anchor = { href: '', download: '', click: clickSpy } as unknown as HTMLAnchorElement;
    spyOn(document, 'createElement').and.returnValue(anchor);

    component.exportCsv();

    expect(adminServiceStub.exportTimeBookingsCsv).toHaveBeenCalledWith(component.from, component.to);
    expect(createObjectUrlSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:mock');
    expect(snackBarOpenSpy).toHaveBeenCalledWith('admin_reports.export_started', 'common.ok', { duration: 2500 });
  });
});
