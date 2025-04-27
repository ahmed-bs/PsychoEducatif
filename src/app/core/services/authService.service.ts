import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router'; 
import { LoginResponse } from '../models/login_response';
import { Parent } from '../models/parent';
@Injectable({
  providedIn: 'any',
})
export class AuthService {
   private apiUrl = environment.apiUrl +"authentification/";
    private currentUserSubject: BehaviorSubject<any>;
    public currentUser: Observable<any>;

    constructor(private http: HttpClient, private router: Router) {
        this.currentUserSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('user')!));
        this.currentUser = this.currentUserSubject.asObservable();
      }
  
    register(data: Parent): Observable<any> {
      return this.http.post(`${this.apiUrl}register/`, data).pipe(
        catchError((error) => {
          console.error(error);
          throw error;
        })
      );
    }
    getToken() {
      return localStorage.getItem('token'); // Ensure the key matches where the token is stored
    }
    login(username_or_email: string, password: string): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}login/`, { username_or_email, password }).pipe(
          catchError((error) => {
            console.error(error);
            throw error;
          })
        );
      }
    
      logout() {
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
        this.http.post(`${this.apiUrl}logout/`, {});
        this.router.navigate(['/signin']);
      }
 
  
    verifyOldPassword(data: any): Observable<any> {
      return this.http.post(`${this.apiUrl}verify-old-password/`, data).pipe(
        catchError((error) => {
          console.error(error);
          throw error;
        })
      );
    }
  
    resetPasswordWithOld(data: any): Observable<any> {
      return this.http.post(`${this.apiUrl}password-reset-with-old/`, data).pipe(
        catchError((error) => {
          console.error(error);
          throw error;
        })
      );
  }

  get currentUserValue() {
    return this.currentUserSubject.value;
  }
}

