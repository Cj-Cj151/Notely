export const NOTE_CATEGORIES = ['GENERAL', 'JOURNAL', 'RESEARCH', 'DRAFT'] as const;

export type NoteCategory = (typeof NOTE_CATEGORIES)[number];
export type NotesSection = 'all' | 'favorites' | 'archive' | 'journal' | 'research' | 'drafts';

export interface Note {
  id: number;
  title: string;
  content: string;
  category: NoteCategory;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoteDraft {
  title: string;
  content: string;
  category: NoteCategory;
}

export interface NoteUpdate {
  title?: string;
  content?: string;
  category?: NoteCategory;
  isFavorite?: boolean;
  isArchived?: boolean;
}

export interface NoteListFilter {
  view?: 'favorites' | 'archive';
  category?: NoteCategory;
}

export interface NotesResponse {
  success: boolean;
  notes: Note[];
}

export interface NoteResponse {
  success: boolean;
  note: Note;
}

export interface DeleteNoteResponse {
  success: boolean;
  message: string;
}
