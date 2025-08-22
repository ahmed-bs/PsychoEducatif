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

    // Get current language from localStorage
    private getCurrentLanguage(): string {
        return localStorage.getItem('selectedLanguage') || 'fr';
    }

    // Helper method to get the appropriate field based on language
    private getLanguageField(data: any, fieldName: string): string {
        const currentLang = this.getCurrentLanguage();
        if (currentLang === 'ar') {
            // For Arabic language, prioritize _ar fields
            return data[`${fieldName}_ar`] || '';
        } else {
            // For French language, prioritize non-_ar fields
            return data[fieldName] || '';
        }
    }

    // Helper method to prepare data for API based on current language
    private prepareDataForLanguage(data: Partial<ProfileCategory>): any {
        const currentLang = this.getCurrentLanguage();
        const preparedData: any = {};

        if (currentLang === 'ar') {
            // For Arabic language, map form data to _ar fields
            preparedData.name_ar = data.name?.trim() || data.name_ar?.trim() || '';
            preparedData.description_ar = data.description?.trim() || data.description_ar?.trim() || '';
            // Clear non-_ar fields since we're in Arabic mode
            preparedData.name = '';
            preparedData.description = '';
        } else {
            // For French language, use the name and description fields as they are
            preparedData.name = data.name?.trim() || '';
            preparedData.description = data.description?.trim() || '';
            // Keep existing _ar fields if they exist
            preparedData.name_ar = data.name_ar?.trim() || '';
            preparedData.description_ar = data.description_ar?.trim() || '';
        }

        return preparedData;
    }

    // List categories for a profile
    getCategories(profileId: number): Observable<ProfileCategory[]> {
        const url = `${this.baseUrl}?profile_id=${profileId}`;
        return this.http.get<ApiResponse<ProfileCategory[]>>(url).pipe(
            map(response => response.data || []),
            catchError(this.handleError)
        );
    }

    // Retrieve a single category
    retrieve(categoryId: number): Observable<ProfileCategory> {
        const url = `${this.baseUrl}${categoryId}/`;
        return this.http.get<ProfileCategory>(url).pipe(
            catchError(this.handleError)
        );
    }

    // Create a new category
    create(profileId: number, categoryData: Partial<ProfileCategory>): Observable<ProfileCategory> {
        // Check if at least one of name or name_ar is provided
        if (!categoryData.name?.trim() && !categoryData.name_ar?.trim()) {
            return throwError(() => new Error('Either name or name_ar must be provided'));
        }

        const url = `${this.baseUrl}?profile_id=${profileId}`;
        const preparedData = this.prepareDataForLanguage(categoryData);
        const body = {
            ...preparedData,
            profile: profileId,
            template_category: null
        };
        
        return this.http.post<ApiResponse<ProfileCategory>>(url, body).pipe(
            map(response => response.data!),
            catchError(this.handleError)
        );
    }

    // Update an existing category
    update(categoryId: number, categoryData: Partial<ProfileCategory>): Observable<ProfileCategory> {
        const url = `${this.baseUrl}${categoryId}/`;
        
        // Prepare update data with Arabic fields support
        const updateData: any = {};
        
        if (categoryData.name !== undefined) {
            updateData.name = categoryData.name?.trim() || '';
        }
        if (categoryData.name_ar !== undefined) {
            updateData.name_ar = categoryData.name_ar?.trim() || '';
        }
        if (categoryData.description !== undefined) {
            updateData.description = categoryData.description?.trim() || '';
        }
        if (categoryData.description_ar !== undefined) {
            updateData.description_ar = categoryData.description_ar?.trim() || '';
        }

        // Check if at least one of name or name_ar is provided when updating
        if (updateData.name === '' && updateData.name_ar === '') {
            return throwError(() => new Error('Either name or name_ar must be provided'));
        }

        return this.http.put<ApiResponse<ProfileCategory>>(url, updateData).pipe(
            map(response => response.data!),
            catchError(this.handleError)
        );
    }

    // Delete a category
    destroy(categoryId: number): Observable<void> {
        const url = `${this.baseUrl}${categoryId}/`;
        return this.http.delete<ApiResponse<void>>(url).pipe(
            map(() => undefined),
            catchError(this.handleError)
        );
    }
}