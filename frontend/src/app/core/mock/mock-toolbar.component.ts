import { Component, inject } from '@angular/core';
import { MockService } from './mock.service';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-mock-toolbar',
  standalone: true,
  imports: [MatButtonToggleModule, MatIconModule],
  template: `
    <div class="mock-toolbar">
      <span class="mock-label">
        <mat-icon>science</mat-icon>
        MOCK
      </span>
      <mat-button-toggle-group [value]="mockService.role()" (change)="switchRole($event.value)">
        <mat-button-toggle value="employee">Employee</mat-button-toggle>
        <mat-button-toggle value="admin">Admin</mat-button-toggle>
        <mat-button-toggle value="superadmin">Super</mat-button-toggle>
      </mat-button-toggle-group>
    </div>
  `,
  styles: [`
    .mock-toolbar {
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 9999;
      background: #37474f;
      color: #fff;
      padding: 8px 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-size: 13px;
    }
    .mock-label {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 600;
      color: #ffab00;
    }
    .mock-label mat-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
    }
  `],
})
export class MockToolbarComponent {
  mockService = inject(MockService);
  private authService = inject(AuthService);

  switchRole(role: 'employee' | 'admin' | 'superadmin'): void {
    this.mockService.setRole(role);
    this.authService.loadUser();
  }
}
