import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { CostCenter } from '../../../core/models/cost-center.model';
import { User } from '../../../core/models/user.model';
import { UserGroup } from '../../../core/models/user-group.model';
import { AdminService } from '../../../core/services/admin.service';
import {
  GroupCostCentersDialogComponent,
  GroupMembersDialogComponent,
  GroupNameDialogComponent,
} from './admin-user-groups.component';

describe('User group dialogs', () => {
  let adminServiceStub: {
    createUserGroup: jasmine.Spy;
    updateUserGroup: jasmine.Spy;
    getUsers: jasmine.Spy;
    setGroupMembers: jasmine.Spy;
    getCostCenters: jasmine.Spy;
    setGroupCostCenters: jasmine.Spy;
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

  const costCenters: CostCenter[] = [
    { id: 10, code: 'DEV', name: 'Development', description: null, is_system: false, is_active: true },
    { id: 11, code: 'SYS', name: 'System', description: null, is_system: true, is_active: true },
    { id: 12, code: 'OLD', name: 'Legacy', description: null, is_system: false, is_active: false },
  ];

  const existingGroup: UserGroup = {
    id: 7,
    name: 'Platform',
    description: 'Shared admins',
    members: [users[0]],
    cost_centers: [costCenters[0]],
  };

  async function configure(component: unknown, data: unknown): Promise<void> {
    await TestBed.resetTestingModule();

    adminServiceStub = {
      createUserGroup: jasmine.createSpy('createUserGroup').and.returnValue(of(existingGroup)),
      updateUserGroup: jasmine.createSpy('updateUserGroup').and.returnValue(of(existingGroup)),
      getUsers: jasmine.createSpy('getUsers').and.returnValue(of(users)),
      setGroupMembers: jasmine.createSpy('setGroupMembers').and.returnValue(of(existingGroup)),
      getCostCenters: jasmine.createSpy('getCostCenters').and.returnValue(of(costCenters)),
      setGroupCostCenters: jasmine.createSpy('setGroupCostCenters').and.returnValue(of(existingGroup)),
    };

    dialogRefStub = {
      close: jasmine.createSpy('close'),
    };

    await TestBed.configureTestingModule({
      imports: [
        component as never,
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
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  }

  it('should create a group with an optional description', async () => {
    await configure(GroupNameDialogComponent, null);
    const fixture = TestBed.createComponent(GroupNameDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.name = 'Operations';
    fixture.componentInstance.description = '';
    fixture.componentInstance.save();

    expect(adminServiceStub.createUserGroup).toHaveBeenCalledWith({
      name: 'Operations',
      description: undefined,
    });
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });

  it('should update an existing group', async () => {
    await configure(GroupNameDialogComponent, existingGroup);
    const fixture = TestBed.createComponent(GroupNameDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.name = 'Platform Team';
    fixture.componentInstance.description = 'Core ownership';
    fixture.componentInstance.save();

    expect(adminServiceStub.updateUserGroup).toHaveBeenCalledWith(7, {
      name: 'Platform Team',
      description: 'Core ownership',
    });
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });

  it('should load users and detect preselected members', async () => {
    await configure(GroupMembersDialogComponent, existingGroup);
    const fixture = TestBed.createComponent(GroupMembersDialogComponent);
    fixture.detectChanges();

    expect(adminServiceStub.getUsers).toHaveBeenCalled();
    expect(fixture.componentInstance.users()).toEqual(users);
    expect(fixture.componentInstance.isSelected(1)).toBeTrue();
    expect(fixture.componentInstance.isSelected(2)).toBeFalse();
  });

  it('should save selected members', async () => {
    await configure(GroupMembersDialogComponent, existingGroup);
    const fixture = TestBed.createComponent(GroupMembersDialogComponent);
    fixture.detectChanges();

    const selectionList = {
      selectedOptions: {
        selected: [{ value: 1 }, { value: 2 }],
      },
    } as unknown as MatSelectionList;

    fixture.componentInstance.save(selectionList);

    expect(adminServiceStub.setGroupMembers).toHaveBeenCalledWith(7, [1, 2]);
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });

  it('should load only active cost centers and keep selected ones marked', async () => {
    await configure(GroupCostCentersDialogComponent, existingGroup);
    const fixture = TestBed.createComponent(GroupCostCentersDialogComponent);
    fixture.detectChanges();

    expect(adminServiceStub.getCostCenters).toHaveBeenCalled();
    expect(fixture.componentInstance.costCenters()).toEqual([costCenters[0], costCenters[1]]);
    expect(fixture.componentInstance.isSelected(10)).toBeTrue();
    expect(fixture.componentInstance.isSelected(11)).toBeFalse();
  });

  it('should save selected cost centers', async () => {
    await configure(GroupCostCentersDialogComponent, existingGroup);
    const fixture = TestBed.createComponent(GroupCostCentersDialogComponent);
    fixture.detectChanges();

    const selectionList = {
      selectedOptions: {
        selected: [{ value: 10 }, { value: 11 }],
      },
    } as unknown as MatSelectionList;

    fixture.componentInstance.save(selectionList);

    expect(adminServiceStub.setGroupCostCenters).toHaveBeenCalledWith(7, [10, 11]);
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });
});
