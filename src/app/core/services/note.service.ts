import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Note } from '../models/note';
import { NoteFilterParams } from '../models/noteFiltesParams';

@Injectable({
  providedIn: 'root'
})

export class NoteService {
  private apiUrl = `${environment.apiUrl}notes/`;

  constructor(private http: HttpClient) { }

  getNotes(profileId: number, filters?: NoteFilterParams): Observable<Note[]> {
    let params = new HttpParams();

    // Add profile_id to the query parameters
    params = params.set('profile_id', profileId.toString());

    if (filters) {
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (typeof filters.important === 'boolean') {
        params = params.set('important', filters.important.toString());
      }
      if (filters.startDate) {
        params = params.set('start_date', filters.startDate);
      }
      if (filters.endDate) {
        params = params.set('end_date', filters.endDate);
      }
      if (filters.authorUsername) {
        params = params.set('author_username', filters.authorUsername);
      }
    }

    return this.http.get<Note[]>(this.apiUrl, { params: params });
  }

  createNote(profileId: number, note: { content: string, is_important: boolean }): Observable<Note> {
    const noteWithProfile = { ...note, profile_id: profileId };
    return this.http.post<Note>(this.apiUrl, noteWithProfile);
  }

  updateNote(id: number, note: Partial<Note>): Observable<Note> {
    return this.http.patch<Note>(`${this.apiUrl}${id}/`, note);
  }

  deleteNote(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}${id}/`);
  }
}