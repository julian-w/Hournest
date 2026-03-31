import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Absence, AbsenceType, AbsenceScope } from '../models/absence.model';
import { CostCenter } from '../models/cost-center.model';
import { TimeLock } from '../models/time-lock.model';
import { TimeEntry } from '../models/time-entry.model';
import { TimeBooking } from '../models/time-booking.model';
import { User } from '../models/user.model';
import { UserGroup } from '../models/user-group.model';
import { Vacation } from '../models/vacation.model';
import { WorkSchedule } from '../models/work-schedule.model';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getPendingVacations(): Observable<Vacation[]> {
    return this.http.get<ApiResponse<Vacation[]>>('/api/admin/vacations/pending').pipe(
      map((response) => response.data)
    );
  }

  reviewVacation(id: number, status: 'approved' | 'rejected', comment?: string): Observable<Vacation> {
    return this.http.patch<ApiResponse<Vacation>>(`/api/admin/vacations/${id}`, {
      status,
      comment: comment || null,
    }).pipe(map((response) => response.data));
  }

  getUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>('/api/admin/users').pipe(
      map((response) => response.data)
    );
  }

  updateUser(id: number, data: {
    role?: string;
    vacation_days_per_year?: number;
    holidays_exempt?: boolean;
    weekend_worker?: boolean;
  }): Observable<User> {
    return this.http.patch<ApiResponse<User>>(`/api/admin/users/${id}`, data).pipe(
      map((response) => response.data)
    );
  }

  createUser(data: { display_name: string; email: string; role: string; password?: string; vacation_days_per_year?: number }): Observable<User> {
    return this.http.post<ApiResponse<User>>('/api/admin/users', data).pipe(
      map((response) => response.data)
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/users/${id}`);
  }

  resetUserPassword(userId: number, password: string): Observable<User> {
    return this.http.patch<ApiResponse<User>>(`/api/admin/users/${userId}/reset-password`, { password }).pipe(
      map((response) => response.data)
    );
  }

  getWorkSchedules(userId: number): Observable<WorkSchedule[]> {
    return this.http.get<ApiResponse<WorkSchedule[]>>(`/api/admin/users/${userId}/work-schedules`).pipe(
      map((response) => response.data)
    );
  }

  createWorkSchedule(userId: number, data: { start_date: string; end_date: string | null; work_days: number[] }): Observable<WorkSchedule> {
    return this.http.post<ApiResponse<WorkSchedule>>(`/api/admin/users/${userId}/work-schedules`, data).pipe(
      map((response) => response.data)
    );
  }

  updateWorkSchedule(id: number, data: { start_date: string; end_date: string | null; work_days: number[] }): Observable<WorkSchedule> {
    return this.http.patch<ApiResponse<WorkSchedule>>(`/api/admin/work-schedules/${id}`, data).pipe(
      map((response) => response.data)
    );
  }

  deleteWorkSchedule(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/work-schedules/${id}`);
  }

  // Cost Centers
  getCostCenters(): Observable<CostCenter[]> {
    return this.http.get<ApiResponse<CostCenter[]>>('/api/admin/cost-centers').pipe(
      map((response) => response.data)
    );
  }

  createCostCenter(data: { code: string; name: string; description?: string }): Observable<CostCenter> {
    return this.http.post<ApiResponse<CostCenter>>('/api/admin/cost-centers', data).pipe(
      map((response) => response.data)
    );
  }

  updateCostCenter(id: number, data: { code?: string; name?: string; description?: string; is_active?: boolean }): Observable<CostCenter> {
    return this.http.patch<ApiResponse<CostCenter>>(`/api/admin/cost-centers/${id}`, data).pipe(
      map((response) => response.data)
    );
  }

  deleteCostCenter(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/cost-centers/${id}`);
  }

  // User Groups
  getUserGroups(): Observable<UserGroup[]> {
    return this.http.get<ApiResponse<UserGroup[]>>('/api/admin/user-groups').pipe(
      map((response) => response.data)
    );
  }

  createUserGroup(data: { name: string; description?: string }): Observable<UserGroup> {
    return this.http.post<ApiResponse<UserGroup>>('/api/admin/user-groups', data).pipe(
      map((response) => response.data)
    );
  }

  updateUserGroup(id: number, data: { name: string; description?: string }): Observable<UserGroup> {
    return this.http.patch<ApiResponse<UserGroup>>(`/api/admin/user-groups/${id}`, data).pipe(
      map((response) => response.data)
    );
  }

  deleteUserGroup(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/user-groups/${id}`);
  }

  setGroupMembers(groupId: number, userIds: number[]): Observable<UserGroup> {
    return this.http.put<ApiResponse<UserGroup>>(`/api/admin/user-groups/${groupId}/members`, { user_ids: userIds }).pipe(
      map((response) => response.data)
    );
  }

  setGroupCostCenters(groupId: number, costCenterIds: number[]): Observable<UserGroup> {
    return this.http.put<ApiResponse<UserGroup>>(`/api/admin/user-groups/${groupId}/cost-centers`, { cost_center_ids: costCenterIds }).pipe(
      map((response) => response.data)
    );
  }

  // Direct cost center assignment
  getUserCostCenters(userId: number): Observable<CostCenter[]> {
    return this.http.get<ApiResponse<CostCenter[]>>(`/api/admin/users/${userId}/cost-centers`).pipe(
      map((response) => response.data)
    );
  }

  setUserCostCenters(userId: number, costCenterIds: number[]): Observable<CostCenter[]> {
    return this.http.put<ApiResponse<CostCenter[]>>(`/api/admin/users/${userId}/cost-centers`, { cost_center_ids: costCenterIds }).pipe(
      map((response) => response.data)
    );
  }

  // Absences
  getAbsences(params?: { status?: string; type?: string; user_id?: number }): Observable<Absence[]> {
    return this.http.get<ApiResponse<Absence[]>>('/api/admin/absences', { params: params as Record<string, string> }).pipe(
      map((response) => response.data)
    );
  }

  reviewAbsence(id: number, status: string, adminComment?: string): Observable<Absence> {
    return this.http.patch<ApiResponse<Absence>>(`/api/admin/absences/${id}`, {
      status,
      admin_comment: adminComment || null,
    }).pipe(map((response) => response.data));
  }

  createAbsence(data: {
    user_id: number;
    start_date: string;
    end_date: string;
    type: AbsenceType;
    scope: AbsenceScope;
    comment?: string;
    admin_comment?: string;
  }): Observable<Absence> {
    return this.http.post<ApiResponse<Absence>>('/api/admin/absences', data).pipe(
      map((response) => response.data)
    );
  }

  deleteAbsence(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/absences/${id}`);
  }

  // Time Bookings Admin
  getUserTimeData(userId: number, from: string, to: string): Observable<{ time_entries: TimeEntry[]; time_bookings: TimeBooking[] }> {
    return this.http.get<ApiResponse<{ time_entries: TimeEntry[]; time_bookings: TimeBooking[] }>>('/api/admin/time-bookings', {
      params: { user_id: userId.toString(), from, to },
    }).pipe(map((response) => response.data));
  }

  // Time Locks
  getTimeLocks(): Observable<TimeLock[]> {
    return this.http.get<ApiResponse<TimeLock[]>>('/api/admin/time-locks').pipe(
      map((response) => response.data)
    );
  }

  toggleTimeLock(year: number, month: number): Observable<void> {
    return this.http.post<void>('/api/admin/time-locks', { year, month });
  }
}
