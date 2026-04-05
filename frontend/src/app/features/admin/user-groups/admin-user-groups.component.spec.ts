import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { UserGroup } from '../../../core/models/user-group.model';
import { AdminUserGroupsComponent } from './admin-user-groups.component';

describe('AdminUserGroupsComponent', () => {
  let adminServiceStub: {
    getUserGroups: jasmine.Spy;
    deleteUserGroup: jasmine.Spy;
  };
  const groups: UserGroup[] = [
    {
      id: 5,
      name: 'Engineering',
      description: 'Product team',
      members: [
        {
          id: 3,
          email: 'ada@example.com',
          display_name: 'Ada Lovelace',
          role: 'employee',
          vacation_days_per_year: 30,
          remaining_vacation_days: 24,
          holidays_exempt: false,
          weekend_worker: false,
        },
      ],
      cost_centers: [
        {
          id: 12,
          code: 'PRJ-ALPHA',
          name: 'Project Alpha',
          description: 'Main project',
          is_system: false,
          is_active: true,
        },
      ],
    },
  ];

  beforeEach(async () => {
    adminServiceStub = {
      getUserGroups: jasmine.createSpy('getUserGroups').and.returnValue(of(groups)),
      deleteUserGroup: jasmine.createSpy('deleteUserGroup').and.returnValue(of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [
        AdminUserGroupsComponent,
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

  it('should load user groups on init', () => {
    const fixture = TestBed.createComponent(AdminUserGroupsComponent);
    fixture.detectChanges();

    expect(adminServiceStub.getUserGroups).toHaveBeenCalled();
    expect(fixture.componentInstance.groups()).toEqual(groups);
    expect(fixture.nativeElement.textContent).toContain('Engineering');
    expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');
    expect(fixture.nativeElement.textContent).toContain('Project Alpha');
  });

  it('should reload groups after the create dialog closes with a result', () => {
    const fixture = TestBed.createComponent(AdminUserGroupsComponent);
    fixture.detectChanges();
    const dialogOpenSpy = spyOn((fixture.componentInstance as never as { dialog: MatDialog }).dialog, 'open').and.returnValue({
      afterClosed: () => of(true),
    } as never);

    adminServiceStub.getUserGroups.calls.reset();

    fixture.componentInstance.openCreateDialog();

    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(adminServiceStub.getUserGroups).toHaveBeenCalled();
  });

  it('should not reload groups after the edit dialog closes without a result', () => {
    const fixture = TestBed.createComponent(AdminUserGroupsComponent);
    fixture.detectChanges();
    const dialogOpenSpy = spyOn((fixture.componentInstance as never as { dialog: MatDialog }).dialog, 'open').and.returnValue({
      afterClosed: () => of(false),
    } as never);

    adminServiceStub.getUserGroups.calls.reset();

    fixture.componentInstance.openEditDialog(groups[0]);

    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(adminServiceStub.getUserGroups).not.toHaveBeenCalled();
  });

  it('should delete a group, show feedback, and reload the list', () => {
    const fixture = TestBed.createComponent(AdminUserGroupsComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    adminServiceStub.getUserGroups.calls.reset();

    fixture.componentInstance.deleteGroup(groups[0]);

    expect(adminServiceStub.deleteUserGroup).toHaveBeenCalledWith(5);
    expect(snackBarOpenSpy).toHaveBeenCalledWith('admin_groups.deleted', 'OK', { duration: 3000 });
    expect(adminServiceStub.getUserGroups).toHaveBeenCalled();
  });
});
