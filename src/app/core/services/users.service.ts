import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private baseUrl = environment.apiUrl + 'authentification/';

  constructor(private http: HttpClient) {}

  getUserInfo(): Observable<any> {
    return this.http.get(`${this.baseUrl}user/`);
  }

  getUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}users/`);
  }

  getUserById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}users/${id}/`);
  }

  updateUser(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}users/${id}/`, data);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}users/${id}/`);
  }
}
