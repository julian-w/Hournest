import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { VacationLedgerEntry } from '../models/vacation-ledger-entry.model';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class VacationLedgerService {
  constructor(private http: HttpClient) {}

  getMyLedger(year: number): Observable<VacationLedgerEntry[]> {
    return this.http.get<ApiResponse<VacationLedgerEntry[]>>('/api/vacation-ledger', {
      params: { year: year.toString() },
    }).pipe(map((response) => response.data));
  }

  getUserLedger(userId: number, year: number): Observable<VacationLedgerEntry[]> {
    return this.http.get<ApiResponse<VacationLedgerEntry[]>>(`/api/admin/users/${userId}/vacation-ledger`, {
      params: { year: year.toString() },
    }).pipe(map((response) => response.data));
  }

  addEntry(userId: number, data: { year: number; type: string; days: number; comment?: string }): Observable<VacationLedgerEntry> {
    return this.http.post<ApiResponse<VacationLedgerEntry>>(`/api/admin/users/${userId}/vacation-ledger`, data).pipe(
      map((response) => response.data)
    );
  }

  deleteEntry(userId: number, entryId: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/users/${userId}/vacation-ledger/${entryId}`);
  }
}
