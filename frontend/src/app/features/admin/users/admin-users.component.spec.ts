import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { ConfigService } from '../../../core/services/config.service';
import { User } from '../../../core/models/user.model';
import { AdminUsersComponent } from './admin-users.component';

describe('AdminUsersComponent', () => {
  let adminServiceStub: {
    getUsers: jasmine.Spy;
    updateUser: jasmine.Spy;
    deleteUser: jasmine.Spy;
  };

  const users: User[] = [
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
  ];

  beforeEach(async () => {
    adminServiceStub = {
      getUsers: jasmine.createSpy('getUsers').and.returnValue(of(users)),
      updateUser: jasmine.createSpy('updateUser').and.returnValue(of(users[0])),
      deleteUser: jasmine.createSpy('deleteUser').and.returnValue(of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [
        AdminUsersComponent,
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
        {
          provide: ConfigService,
          useValue: {
            isOAuthEnabled: () => false,
          },
        },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  it('should load users on init', () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    fixture.detectChanges();

    expect(adminServiceStub.getUsers).toHaveBeenCalled();
    expect(fixture.componentInstance.users()).toEqual(users);
    expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');
    expect(fixture.nativeElement.textContent).toContain('ada@example.com');
  });

  it('should update a user role, show feedback, and reload users', () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    adminServiceStub.getUsers.calls.reset();

    fixture.componentInstance.updateRole(users[0], 'admin');

    expect(adminServiceStub.updateUser).toHaveBeenCalledWith(9, { role: 'admin' });
    expect(snackBarOpenSpy).toHaveBeenCalledWith('admin_users.role_updated', 'common.ok', { duration: 3000 });
    expect(adminServiceStub.getUsers).toHaveBeenCalled();
  });

  it('should ignore invalid vacation-day input', () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    fixture.detectChanges();

    fixture.componentInstance.updateDays(users[0], {
      target: { value: '-1' },
    } as unknown as Event);

    expect(adminServiceStub.updateUser).not.toHaveBeenCalled();
  });

  it('should create a user via dialog, show feedback, and reload users', () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
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
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    adminServiceStub.getUsers.calls.reset();

    fixture.componentInstance.openCreateUserDialog();

    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(snackBarOpenSpy).toHaveBeenCalledWith('admin_users.user_created', 'common.ok', { duration: 3000 });
    expect(adminServiceStub.getUsers).toHaveBeenCalled();
  });

  it('should delete a user after confirmation, show feedback, and reload users', () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');
    const confirmSpy = spyOn(window, 'confirm').and.returnValue(true);

    adminServiceStub.getUsers.calls.reset();

    fixture.componentInstance.deleteUser(users[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(adminServiceStub.deleteUser).toHaveBeenCalledWith(9);
    expect(snackBarOpenSpy).toHaveBeenCalledWith('admin_users.user_deleted', 'common.ok', { duration: 3000 });
    expect(adminServiceStub.getUsers).toHaveBeenCalled();
  });
});
