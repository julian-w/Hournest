import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { User } from '../models/user.model';
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
}
