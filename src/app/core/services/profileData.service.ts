import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Domain {
  id: number;
  template_category: number;
  name: string;
  description: string;
  level: string;
  code?: string;
  items?: Item[];
}

export interface Item {
  id: number;
  template_domain: number;
  name: string;
  description: string;
  code: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileDataService {
  private apiUrl = environment.apiUrl; // e.g., 'http://localhost:8000/api'

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': token ? `Token ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories/`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getDomainsByCategory(categoryId: number): Observable<Domain[]> {
    return this.http.get<Domain[]>(`${this.apiUrl}/domains/?category_id=${categoryId}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getItemsByDomain(domainId: number): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.apiUrl}/items/?domain_id=${domainId}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  createDomain(domain: Partial<Domain>): Observable<Domain> {
    return this.http.post<Domain>(`${this.apiUrl}/domains/`, domain, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateDomain(id: number, domain: Partial<Domain>): Observable<Domain> {
    return this.http.put<Domain>(`${this.apiUrl}/domains/${id}/`, domain, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteDomain(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/domains/${id}/`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  createItem(item: Partial<Item>): Observable<Item> {
    return this.http.post<Item>(`${this.apiUrl}/items/`, item, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateItem(id: number, item: Partial<Item>): Observable<Item> {
    return this.http.put<Item>(`${this.apiUrl}/items/${id}/`, item, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/items/${id}/`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something went wrong; please try again later.'));
  }
}