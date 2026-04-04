import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TimeBookingTemplate } from '../models/time-booking-template.model';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface TemplatePayload {
  name: string;
  items: {
    cost_center_id: number;
    percentage: number;
  }[];
}

@Injectable({ providedIn: 'root' })
export class TimeBookingTemplateService {
  constructor(private http: HttpClient) {}

  getTemplates(): Observable<TimeBookingTemplate[]> {
    return this.http.get<ApiResponse<TimeBookingTemplate[]>>('/api/time-booking-templates').pipe(
      map((response) => response.data)
    );
  }

  createTemplate(payload: TemplatePayload): Observable<TimeBookingTemplate> {
    return this.http.post<ApiResponse<TimeBookingTemplate>>('/api/time-booking-templates', payload).pipe(
      map((response) => response.data)
    );
  }

  updateTemplate(id: number, payload: TemplatePayload): Observable<TimeBookingTemplate> {
    return this.http.patch<ApiResponse<TimeBookingTemplate>>(`/api/time-booking-templates/${id}`, payload).pipe(
      map((response) => response.data)
    );
  }

  deleteTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`/api/time-booking-templates/${id}`);
  }
}
