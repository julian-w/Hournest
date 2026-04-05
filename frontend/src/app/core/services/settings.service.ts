import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AppSetting } from '../models/setting.model';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(private http: HttpClient) {}

  getPublicSettings(): Observable<AppSetting[]> {
    return this.http.get<ApiResponse<AppSetting[]>>('/api/settings').pipe(
      map((response) => response.data)
    );
  }

  getSettings(): Observable<AppSetting[]> {
    return this.http.get<ApiResponse<AppSetting[]>>('/api/admin/settings').pipe(
      map((response) => response.data)
    );
  }

  updateSettings(settings: Record<string, string>): Observable<void> {
    return this.http.put<void>('/api/admin/settings', { settings });
  }
}
