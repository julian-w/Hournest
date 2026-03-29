import { Injectable, signal, computed } from '@angular/core';
import { MOCK_USERS } from './mock-data';
import { User } from '../models/user.model';

type MockRole = 'employee' | 'admin' | 'superadmin';

@Injectable({ providedIn: 'root' })
export class MockService {
  private active = signal(false);
  private currentRole = signal<MockRole>(this.loadRole());

  isActive = this.active.asReadonly();
  role = this.currentRole.asReadonly();

  currentUser = computed<User>(() => {
    const role = this.currentRole();
    if (role === 'superadmin') return MOCK_USERS.find(u => u.role === 'superadmin')!;
    if (role === 'admin') return MOCK_USERS.find(u => u.role === 'admin')!;
    return MOCK_USERS.find(u => u.role === 'employee')!;
  });

  activate(): void {
    this.active.set(true);
  }

  setRole(role: MockRole): void {
    this.currentRole.set(role);
    sessionStorage.setItem('mock_role', role);
  }

  private loadRole(): MockRole {
    return (sessionStorage.getItem('mock_role') as MockRole) || 'employee';
  }
}
