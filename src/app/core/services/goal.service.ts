import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }


  createGoal(goalData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}goals/`, goalData);
  }

  getGoals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}goals/`);
  }

  getGoalsByProfile(profileId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}goals/?profile_id=${profileId}`);
  }

  updateGoal(goalId: number, goalData: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}goals/${goalId}/`, goalData);
  }
  
  deleteGoal(goalId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}goals/${goalId}/`);
  }

  updateTargetDate(goalId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}goals/${goalId}/update-target-date/`, {});
  }
}