import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Profile ,ProfileResponse  } from '../models/profile.model';
import { environment } from 'src/environments/environment';
import { ApiResponse, CreateProfileRequest, ShareProfileRequest, UpdateProfileRequest } from '../models/createprofile.model';

@Injectable({
  providedIn: 'any'
})
export class ProfileService {
  private apiUrl = environment.apiUrl + 'profiles/'; // Adjust to your Django API base URL

  constructor(private http: HttpClient) {
  }
  // Create a child profile
  createChildProfile(profileData: CreateProfileRequest): Observable<Profile> {
    return this.http
      .post<ApiResponse<Profile>>(`${this.apiUrl}create-child/`, profileData)
      .pipe(
        map(response => {
          if (response.error) {
            throw new Error(response.error);
          }
          return response.data!;
        }),
        catchError(this.handleError)
      );
  }

  // Get profiles by parent ID
  getProfilesByParent(parentId: number): Observable<Profile[]> {
    return this.http
      .get<Profile[]>(`${this.apiUrl}user/${parentId}/`)
      .pipe(catchError(this.handleError));
  }

  // Update a child profile
  updateChildProfile(profile: Profile
  ): Observable<Profile> {
    return this.http
      .put<ApiResponse<Profile>>(`${this.apiUrl}${profile.id}/update/`, profile)
      .pipe(
        map(response => {
          if (response.error) {
            throw new Error(response.error);
          }
          return response.data!;
        }),
        catchError(this.handleError)
      );
  }

  // Share a child profile
  shareChildProfile(profileId: number, shareData: ShareProfileRequest): Observable<string> {
    return this.http
      .post<ApiResponse<never>>(`${this.apiUrl}${profileId}/share/`, shareData)
      .pipe(
        map(response => {
          if (response.error) {
            throw new Error(response.error);
          }
          return response.message!;
        }),
        catchError(this.handleError)
      );
  }

  // Delete a child profile
  deleteChildProfile(profileId: number): Observable<string> {
    return this.http
      .delete<ApiResponse<never>>(`${this.apiUrl}${profileId}/delete/`)
      .pipe(
        map(response => {
          if (response.error) {
            throw new Error(response.error);
          }
          return response.message!;
        }),
        catchError(this.handleError)
      );
  }

  // List all profiles (admin only)
  listAllProfiles(): Observable<Profile[]> {
    return this.http
      .get<ApiResponse<Profile[]>>(`${this.apiUrl}list-all/`)
      .pipe(
        map(response => {
          if (response.error) {
            throw new Error(response.error);
          }
          return response.data!;
        }),
        catchError(this.handleError)
      );
  }

  getProfileById(profileId: number): Observable<Profile> {
    const url = `${this.apiUrl}${profileId}/get/`;
    return this.http.get<ProfileResponse>(url).pipe(
      map(response => response.data), 
      catchError(this.handleError)
    );
  }


  // Error handling
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.error || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}