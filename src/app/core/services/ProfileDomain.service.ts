import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { DomainsResponse, ProfileDomain } from '../models/ProfileDomain';

// Interface for API response
interface ApiResponse<T> {
    message?: string;
    data?: T;
    error?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProfileDomainService {
    private baseUrl = environment.apiUrl + 'domains/domains/';

    constructor(private http: HttpClient) {}

    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'An error occurred';
        if (error.error instanceof ErrorEvent) {
            errorMessage = error.error.message;
        } else {
            errorMessage = error.error.error || `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        return throwError(() => new Error(errorMessage));
    }



  getDomainsWithSpecificItems(categoryId: number): Observable<ProfileDomain[]> {

    return this.http.get<ApiResponse<ProfileDomain[]>>(`${this.baseUrl}specific-items/?category_id=${categoryId}`).pipe(
            map(response => response.data || []),
            catchError(this.handleError)
    );
  }
    // List domains for a category
    getDomains(categoryId: number): Observable<ProfileDomain[]> {
        const url = `${this.baseUrl}?category_id=${categoryId}`;
        return this.http.get<ApiResponse<ProfileDomain[]>>(url).pipe(
            map(response => response.data || []),
            catchError(this.handleError)
        );
    }

    // Create a new domain
    create(categoryId: number, domainData: Partial<ProfileDomain>): Observable<ProfileDomain> {
        if (!domainData.name) {
            return throwError(() => new Error('Missing required fields: name'));
        }
        const url = `${this.baseUrl}?category_id=${categoryId}`;
        const body = {
            name: domainData.name,
            description: domainData.description || ''
        };
        return this.http.post<ApiResponse<ProfileDomain>>(url, body).pipe(
            map(response => response.data!),
            catchError(this.handleError)
        );
    }

    // Update an existing domain
    update(domainId: number, domainData: Partial<ProfileDomain>): Observable<ProfileDomain> {
        const url = `${this.baseUrl}${domainId}/`;
        const body = {
            name: domainData.name,
            description: domainData.description
        };
        return this.http.put<ApiResponse<ProfileDomain>>(url, body).pipe(
            map(response => response.data!),
            catchError(this.handleError)
        );
    }

    // Delete a domain
    destroy(domainId: number): Observable<void> {
        const url = `${this.baseUrl}${domainId}/`;
        return this.http.delete<ApiResponse<void>>(url).pipe(
            map(() => undefined),
            catchError(this.handleError)
        );
    }
}