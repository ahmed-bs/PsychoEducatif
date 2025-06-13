import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ProfileItem } from '../models/ProfileItem';

// Interface for API response
interface ApiResponse<T> {
    message?: string;
    data?: T;
    error?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProfileItemService {
    private baseUrl = environment.apiUrl + 'items/items/';

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

    // List items for a domain
    getItems(domainId: number): Observable<ProfileItem[]> {
        const url = `${this.baseUrl}?domain_id=${domainId}`;
        return this.http.get<ApiResponse<ProfileItem[]>>(url).pipe(
            map(response => response.data || []),
            catchError(this.handleError)
        );
    }

    // Create a new item
    create(domainId: number, itemData: Partial<ProfileItem>): Observable<ProfileItem> {
        if (!itemData.name) {
            return throwError(() => new Error('Missing required fields: name'));
        }
        const url = `${this.baseUrl}?domain_id=${domainId}`;
        const body = {
            name: itemData.name,
            description: itemData.description || '',
            etat: itemData.etat || 'NON_COTE',
            comentaire: itemData.comentaire || '-'
        };
        return this.http.post<ApiResponse<ProfileItem>>(url, body).pipe(
            map(response => response.data!),
            catchError(this.handleError)
        );
    }

    // Update an existing item
    update(itemId: number, itemData: Partial<ProfileItem>): Observable<ProfileItem> {
        const url = `${this.baseUrl}${itemId}/`;
        const body: any = {};
        if (itemData.name) body.name = itemData.name;
        if (itemData.description) body.description = itemData.description;
        if (itemData.comentaire) body.comentaire = itemData.comentaire;
        if (itemData.etat) {
            const validEtats = ['ACQUIS', 'PARTIEL', 'NON_ACQUIS', 'NON_COTE'];
            if (!validEtats.includes(itemData.etat)) {
                return throwError(() => new Error('Invalid etat. Must be one of: ACQUIS, PARTIEL, NON_ACQUIS, NON_COTE'));
            }
            body.etat = itemData.etat;
        }
        return this.http.put<ApiResponse<ProfileItem>>(url, body).pipe(
            map(response => response.data!),
            catchError(this.handleError)
        );
    }

    // Delete an item
    destroy(itemId: number): Observable<void> {
        const url = `${this.baseUrl}${itemId}/`;
        return this.http.delete<ApiResponse<void>>(url).pipe(
            map(() => undefined),
            catchError(this.handleError)
        );
    }
}