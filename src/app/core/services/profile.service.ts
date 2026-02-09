import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, throwError, of } from 'rxjs';
import { Profile ,ProfileResponse  } from '../models/profile.model';
import { environment } from 'src/environments/environment';
import { ApiResponse, CreateProfileRequest, ShareProfileRequest, UpdateProfileRequest } from '../models/createprofile.model';
import { ProfileFile, ProfileFilesResponse, ProfileFileUploadResponse } from '../models/profileFile.model';

@Injectable({
  providedIn: 'any'
})
export class ProfileService {
  private apiUrl = environment.apiUrl + 'profiles/'; // Adjust to your Django API base URL

  constructor(private http: HttpClient) {
  }
  // Create a child profile
  createChildProfile(profileData: FormData): Observable<Profile> {
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
  shareProfile(profileId: number, data: ShareProfileRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}${profileId}/share/`, data)
        .pipe(catchError(this.handleError));
}


  // Update a child profile
  updateChildProfile(profileId: number, profileData: FormData
  ): Observable<Profile> {
    return this.http
      .put<ApiResponse<Profile>>(`${this.apiUrl}${profileId}/update/`, profileData)
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
      .delete(`${this.apiUrl}${profileId}/delete/`, { observe: 'response' })
      .pipe(
        map(response => {
          // Check status code first - 200-204 means success
          if (response.status >= 200 && response.status < 300) {
            // Handle empty response (204 No Content)
            if (response.status === 204 || !response.body) {
              return 'Profile deleted successfully';
            }
            // Try to parse response body as ApiResponse
            try {
              const body = typeof response.body === 'string' 
                ? JSON.parse(response.body) 
                : response.body;
              const apiResponse = body as ApiResponse<never>;
              if (apiResponse?.error) {
                throw new Error(apiResponse.error);
              }
              return apiResponse?.message || 'Profile deleted successfully';
            } catch (parseError) {
              // If parsing fails but status is success, deletion succeeded
              return 'Profile deleted successfully';
            }
          }
          throw new Error(`Unexpected status code: ${response.status}`);
        }),
        catchError((error: HttpErrorResponse | Error) => {
          // If it's an HttpErrorResponse with successful status code, deletion succeeded
          if (error instanceof HttpErrorResponse) {
            const status = error.status;
            // 200-299 range means success (including 204 No Content)
            if (status >= 200 && status < 300) {
              // Deletion succeeded - return success message
              return of('Profile deleted successfully');
            }
          }
          // For other errors, use standard error handling
          return this.handleError(error);
        })
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

  // Get users with permissions for a profile
  getProfileUsersPermissions(profileId: number): Observable<any> {
    const url = `${this.apiUrl}${profileId}/users-permissions/`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  // File Management Methods
  // Upload a file for a profile
  uploadProfileFile(profileId: number, file: File, description?: string): Observable<ProfileFile> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    const url = `${this.apiUrl}${profileId}/files/`;
    return this.http.post<ProfileFileUploadResponse>(url, formData).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // Get all files for a profile
  getProfileFiles(profileId: number): Observable<ProfileFile[]> {
    const url = `${this.apiUrl}${profileId}/files/`;
    return this.http.get<ProfileFilesResponse>(url).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // Download a file
  downloadProfileFile(profileId: number, fileId: number): Observable<Blob> {
    const url = `${this.apiUrl}${profileId}/files/${fileId}/download/`;
    return this.http.get(url, { responseType: 'blob' }).pipe(
      catchError(this.handleError)
    );
  }

  // Delete a file
  deleteProfileFile(profileId: number, fileId: number): Observable<string> {
    const url = `${this.apiUrl}${profileId}/files/${fileId}/`;
    return this.http.delete(url, { observe: 'response' }).pipe(
      map(response => {
        // Check status code first - 200-204 means success
        if (response.status >= 200 && response.status < 300) {
          // Handle empty response (204 No Content)
          if (response.status === 204 || !response.body) {
            return 'File deleted successfully';
          }
          // Try to parse response body as ApiResponse
          try {
            const body = typeof response.body === 'string' 
              ? JSON.parse(response.body) 
              : response.body;
            const apiResponse = body as ApiResponse<never>;
            if (apiResponse?.error) {
              throw new Error(apiResponse.error);
            }
            return apiResponse?.message || 'File deleted successfully';
          } catch (parseError) {
            // If parsing fails but status is success, deletion succeeded
            return 'File deleted successfully';
          }
        }
        throw new Error(`Unexpected status code: ${response.status}`);
      }),
      catchError((error: HttpErrorResponse | Error) => {
        // If it's an HttpErrorResponse with successful status code, deletion succeeded
        if (error instanceof HttpErrorResponse) {
          const status = error.status;
          // 200-299 range means success (including 204 No Content)
          if (status >= 200 && status < 300) {
            // Deletion succeeded - return success message
            return of('File deleted successfully');
          }
        }
        // For other errors, use standard error handling
        return this.handleError(error);
      })
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