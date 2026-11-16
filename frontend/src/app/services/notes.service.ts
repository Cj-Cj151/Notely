import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  DeleteNoteResponse,
  Note,
  NoteDraft,
  NoteListFilter,
  NoteResponse,
  NotesResponse,
  NoteUpdate,
} from '../models/note.model';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly http = inject(HttpClient);
  private readonly notesUrl = '/api/notes';

  getNotes(filter: NoteListFilter = {}): Observable<Note[]> {
    let params = new HttpParams();
    if (filter.view) {
      params = params.set('view', filter.view);
    }
    if (filter.category) {
      params = params.set('category', filter.category);
    }

    return this.http
      .get<NotesResponse>(this.notesUrl, { params })
      .pipe(map((response) => response.notes));
  }

  getNote(id: number): Observable<Note> {
    return this.http
      .get<NoteResponse>(`${this.notesUrl}/${id}`)
      .pipe(map((response) => response.note));
  }

  createNote(draft: NoteDraft): Observable<Note> {
    return this.http
      .post<NoteResponse>(this.notesUrl, draft)
      .pipe(map((response) => response.note));
  }

  updateNote(id: number, draft: NoteUpdate): Observable<Note> {
    return this.http
      .put<NoteResponse>(`${this.notesUrl}/${id}`, draft)
      .pipe(map((response) => response.note));
  }

  setFavorite(id: number, isFavorite: boolean): Observable<Note> {
    return this.http
      .put<NoteResponse>(`${this.notesUrl}/${id}/favorite`, { isFavorite })
      .pipe(map((response) => response.note));
  }

  archiveNote(id: number): Observable<Note> {
    return this.http
      .put<NoteResponse>(`${this.notesUrl}/${id}/archive`, {})
      .pipe(map((response) => response.note));
  }

  restoreNote(id: number): Observable<Note> {
    return this.http
      .put<NoteResponse>(`${this.notesUrl}/${id}/restore`, {})
      .pipe(map((response) => response.note));
  }

  deleteNote(id: number): Observable<DeleteNoteResponse> {
    return this.http.delete<DeleteNoteResponse>(`${this.notesUrl}/${id}`);
  }
}
