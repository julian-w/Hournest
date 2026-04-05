import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { User } from '../../../core/models/user.model';
import { AdminService } from '../../../core/services/admin.service';
import { CreateAbsenceDialogComponent } from './admin-absences.component';

describe('CreateAbsenceDialogComponent', () => {
  let adminServiceStub: {
    getUsers: jasmine.Spy;
    createAbsence: jasmine.Spy;
  };
  let dialogRefStub: {
    close: jasmine.Spy;
  };

  const users: User[] = [
    {
      id: 1,
      email: 'ada@example.com',
      display_name: 'Ada Lovelace',
      role: 'employee',
      vacation_days_per_year: 30,
      remaining_vacation_days: 20,
      holidays_exempt: false,
      weekend_worker: false,
    },
    {
      id: 2,
      email: 'grace@example.com',
      display_name: 'Grace Hopper',
      role: 'admin',
      vacation_days_per_year: 28,
      remaining_vacation_days: 18,
      holidays_exempt: false,
      weekend_worker: false,
    },
  ];

  beforeEach(async () => {
    adminServiceStub = {
      getUsers: jasmine.createSpy('getUsers').and.returnValue(of(users)),
      createAbsence: jasmine.createSpy('createAbsence').and.returnValue(of({
        id: 1,
      })),
    };

    dialogRefStub = {
      close: jasmine.createSpy('close'),
    };

    await TestBed.configureTestingModule({
      imports: [
        CreateAbsenceDialogComponent,
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
        { provide: MatDialogRef, useValue: dialogRefStub },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  function localDate(year: number, monthIndex: number, day: number): Date {
    return new Date(year, monthIndex, day, 12, 0, 0);
  }

  it('should load users on init', () => {
    const fixture = TestBed.createComponent(CreateAbsenceDialogComponent);
    fixture.detectChanges();

    expect(adminServiceStub.getUsers).toHaveBeenCalled();
    expect(fixture.componentInstance.users()).toEqual(users);
  });

  it('should require user and dates before saving', () => {
    const fixture = TestBed.createComponent(CreateAbsenceDialogComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.canSave()).toBeFalse();

    fixture.componentInstance.userId = 1;
    fixture.componentInstance.startDate = localDate(2026, 3, 10);
    fixture.componentInstance.endDate = localDate(2026, 3, 10);

    expect(fixture.componentInstance.canSave()).toBeTrue();
  });

  it('should save an absence with formatted dates and close the dialog', () => {
    const fixture = TestBed.createComponent(CreateAbsenceDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.userId = 1;
    fixture.componentInstance.type = 'special_leave';
    fixture.componentInstance.scope = 'afternoon';
    fixture.componentInstance.startDate = localDate(2026, 3, 10);
    fixture.componentInstance.endDate = localDate(2026, 3, 11);
    fixture.componentInstance.adminComment = '  Family matter  ';

    fixture.componentInstance.save();

    expect(adminServiceStub.createAbsence).toHaveBeenCalledWith({
      user_id: 1,
      start_date: '2026-04-10',
      end_date: '2026-04-11',
      type: 'special_leave',
      scope: 'afternoon',
      admin_comment: '  Family matter  ',
    });
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });

  it('should not save if required data is missing', () => {
    const fixture = TestBed.createComponent(CreateAbsenceDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.save();

    expect(adminServiceStub.createAbsence).not.toHaveBeenCalled();
    expect(dialogRefStub.close).not.toHaveBeenCalled();
  });
});
