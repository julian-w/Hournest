import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../../core/services/admin.service';
import { UserGroup } from '../../../core/models/user-group.model';
import { User } from '../../../core/models/user.model';
import { CostCenter } from '../../../core/models/cost-center.model';

@Component({
  selector: 'app-admin-user-groups',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, MatExpansionModule,
    MatDialogModule, MatSnackBarModule, TranslateModule,
  ],
  template: `
    <div class="page-header">
      <h2>{{ 'admin_groups.title' | translate }}</h2>
      <button mat-raised-button color="primary" (click)="openCreateDialog()">
        <mat-icon>add</mat-icon>
        {{ 'admin_groups.add' | translate }}
      </button>
    </div>

    @for (group of groups(); track group.id) {
      <mat-card class="group-card">
        <div class="group-header">
          <div>
            <h3>{{ group.name }}</h3>
            @if (group.description) {
              <p class="group-desc">{{ group.description }}</p>
            }
          </div>
          <div class="group-actions">
            <button mat-icon-button (click)="openEditDialog(group)"><mat-icon>edit</mat-icon></button>
            <button mat-icon-button (click)="openMembersDialog(group)"><mat-icon>people</mat-icon></button>
            <button mat-icon-button (click)="openCostCentersDialog(group)"><mat-icon>account_tree</mat-icon></button>
            <button mat-icon-button color="warn" (click)="deleteGroup(group)"><mat-icon>delete</mat-icon></button>
          </div>
        </div>
        <div class="group-chips">
          <span class="chip-label">{{ 'admin_groups.members' | translate }}:</span>
          @for (member of group.members ?? []; track member.id) {
            <mat-chip>{{ member.display_name }}</mat-chip>
          }
          @if (!group.members?.length) {
            <span class="no-items">{{ 'admin_groups.no_members' | translate }}</span>
          }
        </div>
        <div class="group-chips">
          <span class="chip-label">{{ 'admin_groups.cost_centers' | translate }}:</span>
          @for (cc of group.cost_centers ?? []; track cc.id) {
            <mat-chip>{{ cc.name }}</mat-chip>
          }
          @if (!group.cost_centers?.length) {
            <span class="no-items">{{ 'admin_groups.no_cost_centers' | translate }}</span>
          }
        </div>
      </mat-card>
    }

    @if (groups().length === 0) {
      <mat-card class="empty-state">
        <mat-icon>group_work</mat-icon>
        <p>{{ 'admin_groups.no_data' | translate }}</p>
      </mat-card>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .group-card { margin-bottom: 16px; padding: 16px; }
    .group-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .group-header h3 { margin: 0 0 4px; }
    .group-desc { color: rgba(0,0,0,0.54); font-size: 13px; margin: 0; }
    .group-actions { display: flex; gap: 4px; }
    .group-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 12px; }
    .chip-label { font-size: 13px; color: rgba(0,0,0,0.54); font-weight: 500; }
    .no-items { font-size: 13px; color: rgba(0,0,0,0.38); font-style: italic; }
    .empty-state { text-align: center; padding: 48px 16px; color: rgba(0,0,0,0.38); }
    .empty-state mat-icon { font-size: 48px; height: 48px; width: 48px; }
  `],
})
export class AdminUserGroupsComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  groups = signal<UserGroup[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.adminService.getUserGroups().subscribe(data => this.groups.set(data));
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(GroupNameDialogComponent, { width: '400px', data: null });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  openEditDialog(group: UserGroup): void {
    const ref = this.dialog.open(GroupNameDialogComponent, { width: '400px', data: group });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  openMembersDialog(group: UserGroup): void {
    const ref = this.dialog.open(GroupMembersDialogComponent, { width: '450px', data: group });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  openCostCentersDialog(group: UserGroup): void {
    const ref = this.dialog.open(GroupCostCentersDialogComponent, { width: '450px', data: group });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  deleteGroup(group: UserGroup): void {
    this.adminService.deleteUserGroup(group.id).subscribe(() => {
      this.snackBar.open(this.translate.instant('admin_groups.deleted'), 'OK', { duration: 3000 });
      this.load();
    });
  }
}

@Component({
  selector: 'app-group-name-dialog',
  standalone: true,
  imports: [MatButtonModule, MatInputModule, MatFormFieldModule, MatDialogModule, FormsModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ (data ? 'admin_groups.edit' : 'admin_groups.add') | translate }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'admin_groups.name_label' | translate }}</mat-label>
        <input matInput [(ngModel)]="name">
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'admin_cost_centers.description' | translate }}</mat-label>
        <textarea matInput [(ngModel)]="description" rows="2"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.cancel' | translate }}</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="!name">{{ 'common.save' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`],
})
export class GroupNameDialogComponent {
  private adminService = inject(AdminService);
  private dialogRef = inject(MatDialogRef<GroupNameDialogComponent>);
  data: UserGroup | null = inject(MAT_DIALOG_DATA);
  name = this.data?.name ?? '';
  description = this.data?.description ?? '';

  save(): void {
    const payload = { name: this.name, description: this.description || undefined };
    const obs = this.data
      ? this.adminService.updateUserGroup(this.data.id, payload)
      : this.adminService.createUserGroup(payload);
    obs.subscribe(() => this.dialogRef.close(true));
  }
}

@Component({
  selector: 'app-group-members-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatListModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ 'admin_groups.edit_members' | translate }}</h2>
    <mat-dialog-content>
      <mat-selection-list #memberList>
        @for (user of users(); track user.id) {
          <mat-list-option [value]="user.id" [selected]="isSelected(user.id)">
            {{ user.display_name }} ({{ user.email }})
          </mat-list-option>
        }
      </mat-selection-list>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.cancel' | translate }}</button>
      <button mat-raised-button color="primary" (click)="save(memberList)">{{ 'common.save' | translate }}</button>
    </mat-dialog-actions>
  `,
})
export class GroupMembersDialogComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialogRef = inject(MatDialogRef<GroupMembersDialogComponent>);
  data: UserGroup = inject(MAT_DIALOG_DATA);
  users = signal<User[]>([]);
  private memberIds = new Set<number>();

  ngOnInit(): void {
    this.memberIds = new Set((this.data.members ?? []).map(m => m.id));
    this.adminService.getUsers().subscribe(users => this.users.set(users));
  }

  isSelected(userId: number): boolean {
    return this.memberIds.has(userId);
  }

  save(list: MatSelectionList): void {
    const selectedIds = list.selectedOptions.selected.map(o => o.value as number);
    this.adminService.setGroupMembers(this.data.id, selectedIds).subscribe(() => {
      this.dialogRef.close(true);
    });
  }
}

@Component({
  selector: 'app-group-cost-centers-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatListModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ 'admin_groups.edit_cost_centers' | translate }}</h2>
    <mat-dialog-content>
      <mat-selection-list #ccList>
        @for (cc of costCenters(); track cc.id) {
          <mat-list-option [value]="cc.id" [selected]="isSelected(cc.id)" [disabled]="cc.is_system">
            {{ cc.code }} — {{ cc.name }}
          </mat-list-option>
        }
      </mat-selection-list>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.cancel' | translate }}</button>
      <button mat-raised-button color="primary" (click)="save(ccList)">{{ 'common.save' | translate }}</button>
    </mat-dialog-actions>
  `,
})
export class GroupCostCentersDialogComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialogRef = inject(MatDialogRef<GroupCostCentersDialogComponent>);
  data: UserGroup = inject(MAT_DIALOG_DATA);
  costCenters = signal<CostCenter[]>([]);
  private ccIds = new Set<number>();

  ngOnInit(): void {
    this.ccIds = new Set((this.data.cost_centers ?? []).map(c => c.id));
    this.adminService.getCostCenters().subscribe(ccs => {
      this.costCenters.set(ccs.filter(cc => cc.is_active));
    });
  }

  isSelected(ccId: number): boolean {
    return this.ccIds.has(ccId);
  }

  save(list: MatSelectionList): void {
    const selectedIds = list.selectedOptions.selected.map(o => o.value as number);
    this.adminService.setGroupCostCenters(this.data.id, selectedIds).subscribe(() => {
      this.dialogRef.close(true);
    });
  }
}
