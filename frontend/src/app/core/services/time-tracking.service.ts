import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TimeEntry } from '../models/time-entry.model';
import { TimeBooking } from '../models/time-booking.model';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class TimeTrackingService {
  constructor(private http: HttpClient) {}

  // Time Entries
  getTimeEntries(from: string, to: string): Observable<TimeEntry[]> {
    return this.http.get<ApiResponse<TimeEntry[]>>('/api/time-entries', {
      params: { from, to },
    }).pipe(map((response) => response.data));
  }

  saveTimeEntry(date: string, data: { start_time: string; end_time: string; break_minutes: number }): Observable<TimeEntry> {
    return this.http.put<ApiResponse<TimeEntry>>(`/api/time-entries/${date}`, data).pipe(
      map((response) => response.data)
    );
  }

  deleteTimeEntry(date: string): Observable<void> {
    return this.http.delete<void>(`/api/time-entries/${date}`);
  }

  // Time Bookings
  getTimeBookings(from: string, to: string): Observable<TimeBooking[]> {
    return this.http.get<ApiResponse<TimeBooking[]>>('/api/time-bookings', {
      params: { from, to },
    }).pipe(map((response) => response.data));
  }

  saveTimeBookings(date: string, bookings: { cost_center_id: number; percentage: number; comment?: string }[]): Observable<TimeBooking[]> {
    return this.http.put<ApiResponse<TimeBooking[]>>(`/api/time-bookings/${date}`, { bookings }).pipe(
      map((response) => response.data)
    );
  }
}
