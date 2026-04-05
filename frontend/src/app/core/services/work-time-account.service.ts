import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { WorkTimeAccountEntry } from '../models/work-time-account-entry.model';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class WorkTimeAccountService {
  constructor(private http: HttpClient) {}

  getMyLedger(year: number): Observable<WorkTimeAccountEntry[]> {
    return this.http.get<ApiResponse<WorkTimeAccountEntry[]>>('/api/work-time-account', {
      params: { year: year.toString() },
    }).pipe(map((response) => response.data));
  }

  getUserLedger(userId: number, year: number): Observable<WorkTimeAccountEntry[]> {
    return this.http.get<ApiResponse<WorkTimeAccountEntry[]>>(`/api/admin/users/${userId}/work-time-account`, {
      params: { year: year.toString() },
    }).pipe(map((response) => response.data));
  }

  addEntry(userId: number, data: {
    effective_date: string;
    type: 'manual_adjustment' | 'carryover';
    minutes_delta: number;
    comment: string;
  }): Observable<WorkTimeAccountEntry> {
    return this.http.post<ApiResponse<WorkTimeAccountEntry>>(`/api/admin/users/${userId}/work-time-account`, data).pipe(
      map((response) => response.data)
    );
  }

  deleteEntry(userId: number, entryId: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/users/${userId}/work-time-account/${entryId}`);
  }
}
