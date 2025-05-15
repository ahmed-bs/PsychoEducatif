import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ProfileCategory } from '../models/ProfileCategory';



// Interface for API response
interface ApiResponse<T> {
    message?: string;
    data?: T;
    error?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProfileCategoryService {
    private baseUrl = environment.apiUrl + 'category/categories/';

    constructor(private http: HttpClient) {
    }


    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'An error occurred';
        if (error.error instanceof ErrorEvent) {
            errorMessage = error.error.message;
        } else {
            // Server-side error
            errorMessage = error.error.error || `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        return throwError(() => new Error(errorMessage));
    }

    // List categories for a profile
    getCategories(profileId: number): Observable<ProfileCategory[]> {
        const url = `${this.baseUrl}?profile_id=${profileId}`;
        return this.http.get<ApiResponse<ProfileCategory[]>>(url,).pipe(
            map(response => response.data || []),
            catchError(this.handleError)
        );
    }

    // Retrieve a single category
    retrieve(categoryId: number): Observable<ProfileCategory> {
        const url = `${this.baseUrl}${categoryId}/`;
        return this.http.get<ProfileCategory>(url,).pipe(
            catchError(this.handleError)
        );
    }

    // Create a new category
    create(profileId: number, categoryData: Partial<ProfileCategory>): Observable<ProfileCategory> {
        if (!categoryData.name) {
            return throwError(() => new Error('Missing required fields: name'));
        }
        const url = `${this.baseUrl}?profile_id=${profileId}`;
        const body = {
            name: categoryData.name,
            description: categoryData.description || '',
            profile: profileId,
            template_category: null
        };
        return this.http.post<ApiResponse<ProfileCategory>>(url, body,).pipe(
            map(response => response.data!),
            catchError(this.handleError)
        );
    }

    // Update an existing category
    update(categoryId: number, categoryData: Partial<ProfileCategory>): Observable<ProfileCategory> {
        const url = `${this.baseUrl}${categoryId}/`;
        return this.http.get<ProfileCategory>(url,).pipe(
            switchMap(category => {

                const body = {
                    name: categoryData.name || category.name,
                    description: categoryData.description || category.description
                };
                return this.http.put<ApiResponse<ProfileCategory>>(url, body,).pipe(
                    map(response => response.data!),
                    catchError(this.handleError)
                );
            })
        );
    }

    // Delete a category
    destroy(categoryId: number): Observable<void> {
        const url = `${this.baseUrl}${categoryId}/`;
        return this.http.get<ProfileCategory>(url).pipe(
            switchMap(category => {
                return this.http.delete<ApiResponse<void>>(url,).pipe(
                    map(() => undefined),
                    catchError(this.handleError)
                );
            }),
            catchError(this.handleError)
        );
    }
}