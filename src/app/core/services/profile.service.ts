import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { Profile } from '../models/profile.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'any'
})
export class ProfileService {
  private apiUrl = environment.apiUrl + 'profiles/'; // Adjust to your Django API base URL
  private token: string;

  constructor(private http: HttpClient) {
    this.token = localStorage.getItem('token') || '';
  }

  // Get all children for the authenticated parent
  getChildren(): Observable<Profile[]> {
    return this.http.get<Profile[]>(`${this.apiUrl}my-children/`);
  }

  // Get a specific child by ID
  getChild(childId: number): Observable<Profile> {
    return this.http.get<Profile>(`${this.apiUrl}${childId}/`);
  }

  // Create a new child profile
  createChild(child: Profile): Observable<Profile> {
    return this.http.post<Profile>(`${this.apiUrl}create-children/`, child);
  }

  // Update an existing child profile
  updateChild(child: Profile): Observable<Profile> {
    return this.http.put<Profile>(`${this.apiUrl}${child.id}/`, child);
  }

  // Delete a child profile
  deleteChild(childId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${childId}/`);
  }

  getProfilesByParent(parentId: number): Observable<Profile[]> {
    const url = `${this.apiUrl}by-parent/${parentId}/`;
    return this.http
      .get<Profile[]>(url)
      .pipe(
        catchError(this.handleError)
      );
  }

// Error handling
private handleError(error: any): Observable<never> {
  let errorMessage = 'An error occurred';
  if (error.error instanceof ErrorEvent) {
    // Client-side error
    errorMessage = `Error: ${error.error.message}`;
  } else {
    // Server-side error
    errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    if (error.status === 403) {
      errorMessage = 'Forbidden: You are not authorized to view these profiles';
    } else if (error.status === 404) {
      errorMessage = 'Parent not found';
    }
  }
  console.error(errorMessage);
  return throwError(() => new Error(errorMessage));
}
  // Share a child profile
  shareChildProfile(childId: number, sharedWithParentId: number, permissions: any): Observable<any> {
    const payload = {
      shared_with_parent_id: sharedWithParentId,
      can_read: permissions.can_read || false,
      can_write: permissions.can_write || false,
      can_update: permissions.can_update || false,
      can_delete: permissions.can_delete || false
    };
    return this.http.post(`${this.apiUrl}share-profile/${childId}/`, payload);
  }
}