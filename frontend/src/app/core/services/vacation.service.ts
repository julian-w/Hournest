import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Vacation, VacationScope } from '../models/vacation.model';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class VacationService {
  constructor(private http: HttpClient) {}

  getTeamVacations(): Observable<Vacation[]> {
    return this.http.get<ApiResponse<Vacation[]>>('/api/vacations').pipe(
      map((response) => response.data)
    );
  }

  getMyVacations(): Observable<Vacation[]> {
    return this.http.get<ApiResponse<Vacation[]>>('/api/vacations/mine').pipe(
      map((response) => response.data)
    );
  }

  requestVacation(startDate: string, endDate: string, scope: VacationScope = 'full_day', comment?: string): Observable<Vacation> {
    return this.http.post<ApiResponse<Vacation>>('/api/vacations', {
      start_date: startDate,
      end_date: endDate,
      scope,
      comment: comment || null,
    }).pipe(map((response) => response.data));
  }

  cancelVacation(id: number): Observable<void> {
    return this.http.delete<void>(`/api/vacations/${id}`);
  }
}
