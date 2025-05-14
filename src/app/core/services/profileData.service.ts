// src/app/core/services/profile-data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
  domains_count: number;
  items_count: number;
}

export interface Domain {
  id: number;
  name: string;
  description: string;
  profile_category: number;
  item_count: number;
  acquis_percentage: number;
  template_domain?: number | null;
}

export interface Item {
  id: number;
  name: string;
  description: string;
  etat: 'ACQUIS' | 'PARTIEL' | 'NON_ACQUIS' | 'NON_COTE';
  profile_domain: number;
  is_modified: boolean;
  modified_at: string;
  template_item?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileDataService {
  private apiUrl = environment.apiUrl; // Should be e.g., 'http://localhost:8000/api/'

  constructor(private http: HttpClient) {}



  // Categories
  getCategories(profileId: number): Observable<Category[]> {
    return this.http
      .get<{ message: string; data: Category[] }>(
        `${this.apiUrl}profiles/${profileId}/categories/`,
  
      )
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  createCategory(profileId: number, category: Partial<Category>): Observable<Category> {
    return this.http
      .post<{ message: string; data: Category }>(
        `${this.apiUrl}profiles/${profileId}/categories/`,
        category,
  
      )
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

getCategory(categoryId: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/categories/${categoryId}/`).pipe(
    map(response => {
      return response;
    }),
    catchError(error => {
      console.error('API Error:', error);
      throw new Error('Failed to load category');
    })
  );
}

  updateCategory(categoryId: number, category: Partial<Category>): Observable<Category> {
    return this.http
      .put<{ message: string; data: Category }>(
        `${this.apiUrl}categories/${categoryId}/`,
        category,
  
      )
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  deleteCategory(categoryId: number): Observable<void> {
    return this.http
      .delete<{ message: string }>(`${this.apiUrl}categories/${categoryId}/`,)
      .pipe(
        map(() => undefined),
        catchError(this.handleError)
      );
  }

  // Domains
  getDomainsByCategory(categoryId: number): Observable<Domain[]> {
    return this.http
      .get<{ message: string; data: Domain[] }>(
        `${this.apiUrl}categories/${categoryId}/domains/`,
  
      )
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  createDomain(categoryId: number, domain: Partial<Domain>): Observable<Domain> {
    return this.http
      .post<{ message: string; data: Domain }>(
        `${this.apiUrl}categories/${categoryId}/domains/`,
        domain,
  
      )
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  getDomain(domainId: number): Observable<Domain> {
    return this.http
      .get<{ message: string; data: Domain }>(
        `${this.apiUrl}categories/${domainId}/`,
  
      )
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  updateDomain(domainId: number, domain: Partial<Domain>): Observable<Domain> {
    return this.http
      .put<{ message: string; data: Domain }>(
        `${this.apiUrl}categories/${domainId}/`,
        domain,
  
      )
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  deleteDomain(domainId: number): Observable<void> {
    return this.http
      .delete<{ message: string }>(`${this.apiUrl}categories/${domainId}/`,)
      .pipe(
        map(() => undefined),
        catchError(this.handleError)
      );
  }

  // Items
  getItemsByDomain(domainId: number): Observable<Item[]> {
    return this.http
      .get<{ message: string; data: Item[] }>(
        `${this.apiUrl}items/domain/${domainId}/items/`,
  
      )
      ?.pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  createItem(domainId: number, item: Partial<Item>): Observable<Item> {
    return this.http
      .post<{ message: string; data: Item }>(
        `${this.apiUrl}items/domain/${domainId}/items/`,
        item,
  
      )
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  getItem(itemId: number): Observable<Item> {
    return this.http
      .get<{ message: string; data: Item }>(
        `${this.apiUrl}items/${itemId}/`,
  
      )
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  updateItem(itemId: number, item: Partial<Item>): Observable<Item> {
    return this.http
      .put<{ message: string; data: Item }>(
        `${this.apiUrl}items/${itemId}/`,
        item,
  
      )
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  deleteItem(itemId: number): Observable<void> {
    return this.http
      .delete<{ message: string }>(`${this.apiUrl}items/${itemId}/`,)
      .pipe(
        map(() => undefined),
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error && error.error.error) {
      errorMessage = error.error.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return throwError(() => new Error(errorMessage));
  }
}