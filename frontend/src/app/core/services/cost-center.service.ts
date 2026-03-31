import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CostCenter } from '../models/cost-center.model';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class CostCenterService {
  constructor(private http: HttpClient) {}

  getAvailableCostCenters(): Observable<CostCenter[]> {
    return this.http.get<ApiResponse<CostCenter[]>>('/api/cost-centers').pipe(
      map((response) => response.data)
    );
  }

  getFavorites(): Observable<CostCenter[]> {
    return this.http.get<ApiResponse<CostCenter[]>>('/api/cost-center-favorites').pipe(
      map((response) => response.data)
    );
  }

  addFavorite(costCenterId: number): Observable<void> {
    return this.http.post<void>('/api/cost-center-favorites', { cost_center_id: costCenterId });
  }

  removeFavorite(costCenterId: number): Observable<void> {
    return this.http.delete<void>(`/api/cost-center-favorites/${costCenterId}`);
  }

  reorderFavorites(costCenterIds: number[]): Observable<void> {
    return this.http.patch<void>('/api/cost-center-favorites/reorder', { cost_center_ids: costCenterIds });
  }
}
