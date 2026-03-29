import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Holiday, HolidayInstance } from '../models/holiday.model';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class HolidayService {
  constructor(private http: HttpClient) {}

  getHolidays(year?: number): Observable<Holiday[]> {
    const params: Record<string, string> = {};
    if (year) {
      params['year'] = year.toString();
    }
    return this.http.get<ApiResponse<Holiday[]>>('/api/holidays', { params }).pipe(
      map((response) => response.data)
    );
  }

  getHolidayInstances(year: number): Observable<HolidayInstance[]> {
    return this.http.get<ApiResponse<HolidayInstance[]>>(`/api/admin/holidays/year/${year}`).pipe(
      map((response) => response.data)
    );
  }

  isYearConfirmed(year: number): Observable<boolean> {
    return this.getHolidayInstances(year).pipe(
      map(instances => instances.every(i => i.confirmed))
    );
  }

  createHoliday(data: {
    name: string;
    date: string;
    type: 'fixed' | 'variable';
    start_year: number;
    end_year?: number | null;
  }): Observable<Holiday> {
    return this.http.post<ApiResponse<Holiday>>('/api/admin/holidays', data).pipe(
      map((response) => response.data)
    );
  }

  updateHoliday(id: number, data: {
    name: string;
    date: string;
    type: 'fixed' | 'variable';
    start_year: number;
    end_year?: number | null;
  }): Observable<Holiday> {
    return this.http.patch<ApiResponse<Holiday>>(`/api/admin/holidays/${id}`, data).pipe(
      map((response) => response.data)
    );
  }

  updateHolidayDate(holidayId: number, year: number, date: string): Observable<HolidayInstance> {
    return this.http.patch<ApiResponse<HolidayInstance>>(`/api/admin/holidays/${holidayId}/year/${year}`, { date }).pipe(
      map((response) => response.data)
    );
  }

  deleteHoliday(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/holidays/${id}`);
  }
}
