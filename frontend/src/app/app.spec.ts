import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { App } from './app';
import { Note, NoteCategory, NoteListFilter, NotesSection } from './models/note.model';
import { NotesService } from './services/notes.service';

const CATEGORY_TRANSITIONS = (['GENERAL', 'JOURNAL', 'RESEARCH', 'DRAFT'] as const).flatMap(
  (source) =>
    (['GENERAL', 'JOURNAL', 'RESEARCH', 'DRAFT'] as const).map(
      (target) => [source, target] as const,
    ),
);

function sectionForCategory(category: NoteCategory): NotesSection {
  switch (category) {
    case 'GENERAL':
      return 'all';
    case 'JOURNAL':
      return 'journal';
    case 'RESEARCH':
      return 'research';
    case 'DRAFT':
      return 'drafts';
  }
}

describe('App category changes', () => {
  it.each(CATEGORY_TRANSITIONS)(
    'keeps the edited note selected when changing %s to %s',
    (sourceCategory,targetCategory) => {
      const originalNote: Note = {
        id: 1,
        title: 'Before',
        content: 'Original content',
        category: sourceCategory,
        isFavorite: true,
        isArchived: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      const notes = [originalNote];
      const notesService = {
        getNotes: vi.fn((filter: NoteListFilter = {}) =>
          of(
            notes.filter((note) => {
              if (filter.view === 'archive') {
                return note.isArchived;
              }
              if (filter.view === 'favorites') {
                return note.isFavorite && !note.isArchived;
              }
              if (filter.category) {
                return note.category === filter.category && !note.isArchived;
              }
              return !note.isArchived;
            }),
          ),
        ),
        createNote: vi.fn(),
        updateNote: vi.fn((_id: number, draft: Pick<Note, 'title' | 'content' | 'category'>) => {
          const updatedNote = { ...notes[0], ...draft, updatedAt: '2026-01-02T00:00:00.000Z' };
          notes[0] = updatedNote;
          return of(updatedNote);
        }),
      };

      TestBed.configureTestingModule({
        imports: [App],
        providers: [
          { provide: NotesService, useValue: notesService },
          { provide: MatDialog, useValue: { open: vi.fn() } },
        ],
      });

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const app = fixture.componentInstance;

      app.selectSection(sectionForCategory(sourceCategory));
      app.selectNote(originalNote);
      app.startEditing();
      app.saveNote({
        title: 'Updated title',
        content: 'Updated content',
        category: targetCategory,
      });

      expect(app.section()).toBe(sectionForCategory(targetCategory));
      expect(app.selectedNote()).toMatchObject({
        id: 1,
        title: 'Updated title',
        content: 'Updated content',
        category: targetCategory,
        isFavorite: true,
        isArchived: false,
      });
      expect(app.editorMode()).toBe('view');
      expect(notes).toHaveLength(1);
      expect(notesService.updateNote).toHaveBeenCalledTimes(1);
      expect(notesService.createNote).not.toHaveBeenCalled();

      fixture.destroy();
    },
  );

  it('keeps the editor and current category when an update fails', () => {
    const note: Note = {
      id: 1,
      title: 'Before',
      content: 'Original content',
      category: 'JOURNAL',
      isFavorite: false,
      isArchived: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const notesService = {
      getNotes: vi.fn(() => of([note])),
      createNote: vi.fn(),
      updateNote: vi.fn(() => throwError(() => new Error('Save failed'))),
    };

    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: NotesService, useValue: notesService },
        { provide: MatDialog, useValue: { open: vi.fn() } },
      ],
    });

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance;

    app.selectSection('journal');
    app.selectNote(note);
    app.startEditing();
    app.saveNote({ title: 'Changed', content: 'Changed', category: 'RESEARCH' });

    expect(app.section()).toBe('journal');
    expect(app.selectedNote()).toBe(note);
    expect(app.editorMode()).toBe('edit');
    expect(app.operationError()).toBe('Your note could not be saved. Please try again.');
    expect(notesService.getNotes).toHaveBeenCalledTimes(2);
    expect(notesService.createNote).not.toHaveBeenCalled();

    fixture.destroy();
  });
});
