import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { AdminRequestsComponent } from './admin-requests.component';

describe('AdminRequestsComponent', () => {
  let adminServiceStub: {
    getPendingVacations: jasmine.Spy;
    reviewVacation: jasmine.Spy;
  };

  const pendingVacations = [
    {
      id: 5,
      user_id: 9,
      user_name: 'Ada Lovelace',
      start_date: '2026-04-06',
      end_date: '2026-04-08',
      scope: 'full_day' as const,
      workdays: 3,
      status: 'pending' as const,
      comment: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: '2026-04-01T08:00:00Z',
    },
    {
      id: 6,
      user_id: 10,
      user_name: 'Grace Hopper',
      start_date: '2026-04-12',
      end_date: '2026-04-12',
      scope: 'morning' as const,
      workdays: 0.5,
      status: 'pending' as const,
      comment: 'Doctor appointment',
      reviewed_by: null,
      reviewed_at: null,
      created_at: '2026-04-02T08:00:00Z',
    },
  ];

  beforeEach(async () => {
    adminServiceStub = {
      getPendingVacations: jasmine.createSpy('getPendingVacations').and.returnValue(of(pendingVacations)),
      reviewVacation: jasmine.createSpy('reviewVacation').and.returnValue(of({
        ...pendingVacations[0],
        status: 'approved' as const,
      })),
    };

    await TestBed.configureTestingModule({
      imports: [
        AdminRequestsComponent,
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

  it('should load pending vacations on init', () => {
    const fixture = TestBed.createComponent(AdminRequestsComponent);
    fixture.detectChanges();

    expect(adminServiceStub.getPendingVacations).toHaveBeenCalled();
    expect(fixture.componentInstance.vacations()).toEqual(pendingVacations);
    expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');
    expect(fixture.nativeElement.textContent).toContain('Grace Hopper');
  });

  it('should approve a vacation with a comment, show feedback, and reload', () => {
    const fixture = TestBed.createComponent(AdminRequestsComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    fixture.componentInstance.comments[5] = 'Approved for coverage plan';
    adminServiceStub.getPendingVacations.calls.reset();

    fixture.componentInstance.review(pendingVacations[0], 'approved');

    expect(adminServiceStub.reviewVacation).toHaveBeenCalledWith(5, 'approved', 'Approved for coverage plan');
    expect(snackBarOpenSpy).toHaveBeenCalledWith('admin_requests.approved_msg', 'common.ok', { duration: 3000 });
    expect(adminServiceStub.getPendingVacations).toHaveBeenCalled();
  });

  it('should reject a vacation without a comment and reload', () => {
    const fixture = TestBed.createComponent(AdminRequestsComponent);
    fixture.detectChanges();

    adminServiceStub.getPendingVacations.calls.reset();

    fixture.componentInstance.review(pendingVacations[1], 'rejected');

    expect(adminServiceStub.reviewVacation).toHaveBeenCalledWith(6, 'rejected', undefined);
    expect(adminServiceStub.getPendingVacations).toHaveBeenCalled();
  });

  it('should show backend error feedback when review fails', () => {
    const fixture = TestBed.createComponent(AdminRequestsComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    adminServiceStub.reviewVacation.and.returnValue({
      subscribe: ({ error }: { error: (err: { error: { message: string } }) => void }) =>
        error({ error: { message: 'Conflict with blackout period' } }),
    } as never);
    adminServiceStub.getPendingVacations.calls.reset();

    fixture.componentInstance.review(pendingVacations[0], 'approved');

    expect(snackBarOpenSpy).toHaveBeenCalledWith('Conflict with blackout period', 'common.ok', { duration: 3000 });
    expect(adminServiceStub.getPendingVacations).not.toHaveBeenCalled();
  });
});
