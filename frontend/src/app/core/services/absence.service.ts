import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Absence, AbsenceType, AbsenceScope } from '../models/absence.model';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AbsenceService {
  constructor(private http: HttpClient) {}

  getMyAbsences(): Observable<Absence[]> {
    return this.http.get<ApiResponse<Absence[]>>('/api/absences/mine').pipe(
      map((response) => response.data)
    );
  }

  reportAbsence(data: {
    start_date: string;
    end_date: string;
    type: AbsenceType;
    scope: AbsenceScope;
    comment?: string;
  }): Observable<Absence> {
    return this.http.post<ApiResponse<Absence>>('/api/absences', data).pipe(
      map((response) => response.data)
    );
  }

  cancelAbsence(id: number): Observable<void> {
    return this.http.delete<void>(`/api/absences/${id}`);
  }
}
