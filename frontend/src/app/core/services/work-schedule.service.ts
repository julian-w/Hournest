import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { WorkSchedule } from '../models/work-schedule.model';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class WorkScheduleService {
  constructor(private http: HttpClient) {}

  getMyWorkSchedules(): Observable<WorkSchedule[]> {
    return this.http.get<ApiResponse<WorkSchedule[]>>('/api/work-schedules/mine').pipe(
      map((response) => response.data)
    );
  }
}
