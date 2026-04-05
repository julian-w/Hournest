import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { AdminReportsComponent } from './admin-reports.component';

describe('AdminReportsComponent', () => {
  let adminServiceStub: {
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
      getAbsenceReport: jasmine.createSpy('getAbsenceReport').and.returnValue(of([])),
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
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: AdminService, useValue: adminServiceStub },
        { provide: MatSnackBar, useValue: snackBarStub },
        {
          provide: TranslateService,
          useValue: {
            instant: (key: string) => key,
            use: jasmine.createSpy('use'),
          },
        },
      ],
    }).compileComponents();
  });

  it('should load summary and missing entry reports on init', () => {
    const fixture = TestBed.createComponent(AdminReportsComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;

    expect(adminServiceStub.getTimeBookingReport).toHaveBeenCalled();
    expect(adminServiceStub.getMissingEntriesReport).toHaveBeenCalled();
    expect(adminServiceStub.getAbsenceReport).toHaveBeenCalled();
    expect(component.timeBookingRows()[0].label).toBe('Ada Lovelace');
    expect(component.missingEntries()[0].reason).toBe('incomplete_booking');
  });

  it('should reload the summary when the grouping changes', () => {
    const fixture = TestBed.createComponent(AdminReportsComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.groupBy = 'cost_center';
    component.loadReports();

    expect(adminServiceStub.getTimeBookingReport).toHaveBeenCalledWith(component.from, component.to, 'cost_center');
  });

  it('should export the selected period as csv and show a snackbar', () => {
    const fixture = TestBed.createComponent(AdminReportsComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
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
    expect(snackBarStub.open).toHaveBeenCalledWith('admin_reports.export_started', 'common.ok', { duration: 2500 });
  });
});
