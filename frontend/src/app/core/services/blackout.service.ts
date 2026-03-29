import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BlackoutPeriod } from '../models/blackout-period.model';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class BlackoutService {
  constructor(private http: HttpClient) {}

  getBlackouts(): Observable<BlackoutPeriod[]> {
    return this.http.get<ApiResponse<BlackoutPeriod[]>>('/api/admin/blackouts').pipe(
      map(r => r.data)
    );
  }

  createBlackout(data: { type: 'freeze' | 'company_holiday'; start_date: string; end_date: string; reason: string }): Observable<BlackoutPeriod> {
    return this.http.post<ApiResponse<BlackoutPeriod>>('/api/admin/blackouts', data).pipe(
      map(r => r.data)
    );
  }

  updateBlackout(id: number, data: { type: 'freeze' | 'company_holiday'; start_date: string; end_date: string; reason: string }): Observable<BlackoutPeriod> {
    return this.http.patch<ApiResponse<BlackoutPeriod>>(`/api/admin/blackouts/${id}`, data).pipe(
      map(r => r.data)
    );
  }

  deleteBlackout(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/blackouts/${id}`);
  }

  checkDate(startDate: string, endDate: string): Observable<BlackoutPeriod | null> {
    return this.http.get<ApiResponse<BlackoutPeriod[]>>('/api/blackouts/check', {
      params: { start_date: startDate, end_date: endDate }
    }).pipe(
      map(r => r.data.length > 0 ? r.data[0] : null)
    );
  }
}
