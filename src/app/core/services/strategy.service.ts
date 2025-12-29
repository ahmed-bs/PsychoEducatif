import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Strategy, CategoriesWithPartielItemsResponse } from '../models/strategy';

@Injectable({
  providedIn: 'root'
})
export class StrategyService {
  private baseUrl = `${environment.apiUrl}strategies/`;

  constructor(private http: HttpClient) { }


  getStrategies(profileId: number | null = null): Observable<Strategy[]> {
    let params = new HttpParams();
    if (profileId !== null) {
      params = params.set('profile_id', profileId.toString());
    }
    return this.http.get<Strategy[]>(this.baseUrl, { params });
  }

  getCategoriesWithPartielItems(profileId: number | null = null): Observable<CategoriesWithPartielItemsResponse> {
    let params = new HttpParams();
    if (profileId !== null) {
      params = params.set('profile_id', profileId.toString());
    }
    const url = `${this.baseUrl}categories-with-partiel-items/`;
    return this.http.get<CategoriesWithPartielItemsResponse>(url, { params });
  }


  createStrategy(strategy: Omit<Strategy, 'id' | 'author' | 'created_at' | 'updated_at' | 'author_username' | 'profile_name'>): Observable<Strategy> {
    return this.http.post<Strategy>(this.baseUrl, strategy);
  }

  updateStrategy(strategy: Strategy): Observable<Strategy> {
    const url = `${this.baseUrl}${strategy.id}/`;
    return this.http.put<Strategy>(url, strategy);
  }


  deleteStrategy(id: number): Observable<any> {
    const url = `${this.baseUrl}${id}/`;
    return this.http.delete(url);
  }
}