import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../../core/services/admin.service';
import { CostCenter } from '../../../core/models/cost-center.model';

@Component({
  selector: 'app-admin-cost-centers',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatTableModule, MatCardModule, MatChipsModule,
    MatDialogModule, MatSnackBarModule, TranslateModule,
  ],
  template: `
    <div class="page-header">
      <h2>{{ 'admin_cost_centers.title' | translate }}</h2>
      <button mat-raised-button color="primary" (click)="openDialog()">
        <mat-icon>add</mat-icon>
        {{ 'admin_cost_centers.add' | translate }}
      </button>
    </div>

    <mat-card>
      <table mat-table [dataSource]="costCenters()">
        <ng-container matColumnDef="code">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_cost_centers.code' | translate }}</th>
          <td mat-cell *matCellDef="let cc">{{ cc.code }}</td>
        </ng-container>

        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_cost_centers.name' | translate }}</th>
          <td mat-cell *matCellDef="let cc">{{ cc.name }}</td>
        </ng-container>

        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_cost_centers.description' | translate }}</th>
          <td mat-cell *matCellDef="let cc">{{ cc.description || '\u2014' }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_cost_centers.status' | translate }}</th>
          <td mat-cell *matCellDef="let cc">
            @if (cc.is_system) {
              <mat-chip>{{ 'admin_cost_centers.system' | translate }}</mat-chip>
            } @else if (cc.is_active) {
              <mat-chip class="status-active">{{ 'admin_cost_centers.active' | translate }}</mat-chip>
            } @else {
              <mat-chip class="status-inactive">{{ 'admin_cost_centers.inactive' | translate }}</mat-chip>
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let cc">
            @if (!cc.is_system) {
              <button mat-icon-button (click)="openDialog(cc)"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="warn" (click)="deleteCostCenter(cc)"><mat-icon>archive</mat-icon></button>
            }
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>

      @if (costCenters().length === 0) {
        <div class="empty-state">
          <mat-icon>account_tree</mat-icon>
          <p>{{ 'admin_cost_centers.no_data' | translate }}</p>
        </div>
      }
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    table { width: 100%; }
    .status-active { background-color: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-inactive { background-color: #ffebee !important; color: #c62828 !important; }
    .empty-state { text-align: center; padding: 48px 16px; color: rgba(0,0,0,0.38); }
    .empty-state mat-icon { font-size: 48px; height: 48px; width: 48px; }
  `],
})
export class AdminCostCentersComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  costCenters = signal<CostCenter[]>([]);
  columns = ['code', 'name', 'description', 'status', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.adminService.getCostCenters().subscribe(data => this.costCenters.set(data));
  }

  openDialog(cc?: CostCenter): void {
    const ref = this.dialog.open(CostCenterDialogComponent, {
      width: '450px',
      data: cc ?? null,
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.load();
    });
  }

  deleteCostCenter(cc: CostCenter): void {
    this.adminService.deleteCostCenter(cc.id).subscribe(() => {
      this.snackBar.open(this.translate.instant('admin_cost_centers.archived'), 'OK', { duration: 3000 });
      this.load();
    });
  }
}

@Component({
  selector: 'app-cost-center-dialog',
  standalone: true,
  imports: [
    MatButtonModule, MatInputModule, MatFormFieldModule, MatSlideToggleModule,
    MatDialogModule, FormsModule, TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ (data ? 'admin_cost_centers.edit' : 'admin_cost_centers.add') | translate }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'admin_cost_centers.code' | translate }}</mat-label>
        <input matInput [(ngModel)]="code" [disabled]="!!data">
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'admin_cost_centers.name' | translate }}</mat-label>
        <input matInput [(ngModel)]="name">
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'admin_cost_centers.description' | translate }}</mat-label>
        <textarea matInput [(ngModel)]="description" rows="2"></textarea>
      </mat-form-field>
      @if (data) {
        <mat-slide-toggle [(ngModel)]="isActive">{{ 'admin_cost_centers.active' | translate }}</mat-slide-toggle>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.cancel' | translate }}</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="!code || !name">
        {{ 'common.save' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`],
})
export class CostCenterDialogComponent {
  private adminService = inject(AdminService);
  private dialogRef = inject(MatDialogRef<CostCenterDialogComponent>);
  data: CostCenter | null = inject(MAT_DIALOG_DATA);

  code = this.data?.code ?? '';
  name = this.data?.name ?? '';
  description = this.data?.description ?? '';
  isActive = this.data?.is_active ?? true;

  save(): void {
    if (this.data) {
      this.adminService.updateCostCenter(this.data.id, {
        name: this.name,
        description: this.description || undefined,
        is_active: this.isActive,
      }).subscribe(() => this.dialogRef.close(true));
    } else {
      this.adminService.createCostCenter({
        code: this.code,
        name: this.name,
        description: this.description || undefined,
      }).subscribe(() => this.dialogRef.close(true));
    }
  }
}
