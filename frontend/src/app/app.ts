import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { DeleteConfirmationDialogComponent } from './components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { NoteEditorComponent, EditorMode } from './components/note-editor/note-editor.component';
import { NotesListComponent } from './components/notes-list/notes-list.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { Note, NoteDraft, NoteListFilter, NotesSection } from './models/note.model';
import { NotesService } from './services/notes.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatDialogModule,
    NoteEditorComponent,
    NotesListComponent,
    SidebarComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly notesService = inject(NotesService);
  private readonly dialog = inject(MatDialog);

  readonly notes = signal<Note[]>([]);
  readonly selectedNote = signal<Note | null>(null);
  readonly section = signal<NotesSection>('all');
  readonly editorMode = signal<EditorMode>('empty');
  readonly searchQuery = signal('');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly operationError = signal<string | null>(null);
  readonly mobileEditorOpen = signal(false);

  readonly visibleNotes = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    const notes = this.notes();

    return query
      ? notes.filter(
          (note) =>
            note.title.toLocaleLowerCase().includes(query) ||
            note.content.toLocaleLowerCase().includes(query),
        )
      : notes;
  });

  constructor() {
    this.loadNotes();
  }

  selectNote(note: Note): void {
    this.selectedNote.set(note);
    this.editorMode.set('view');
    this.operationError.set(null);
    this.mobileEditorOpen.set(true);
  }

  selectSection(section: NotesSection): void {
    if (this.section() === section) {
      return;
    }

    this.section.set(section);
    this.searchQuery.set('');
    this.selectedNote.set(null);
    this.editorMode.set('empty');
    this.mobileEditorOpen.set(false);
    this.operationError.set(null);
    this.loadNotes();
  }

  createNote(): void {
    this.selectedNote.set(null);
    this.editorMode.set('create');
    this.operationError.set(null);
    this.mobileEditorOpen.set(true);
  }

  startEditing(): void {
    if (!this.selectedNote()) {
      return;
    }

    this.editorMode.set('edit');
    this.operationError.set(null);
  }

  cancelEditing(): void {
    if (this.editorMode() === 'create') {
      this.editorMode.set(this.selectedNote() ? 'view' : 'empty');
      if (!this.selectedNote()) {
        this.mobileEditorOpen.set(false);
      }
    } else {
      this.editorMode.set('view');
    }

    this.operationError.set(null);
  }

  saveNote(draft: NoteDraft): void {
    if (this.saving()) {
      return;
    }

    const mode = this.editorMode();
    const selected = this.selectedNote();

    if (mode !== 'create' && !selected) {
      return;
    }

    this.saving.set(true);
    this.operationError.set(null);

    let request: Observable<Note>;
    if (mode === 'create') {
      request = this.notesService.createNote(draft);
    } else if (selected) {
      request = this.notesService.updateNote(selected.id, draft);
    } else {
      return;
    }

    request.subscribe({
      next: (note) => {
        this.saving.set(false);
        this.selectedNote.set(note);
        this.editorMode.set('view');
        this.mobileEditorOpen.set(true);
        if (mode !== 'create' && selected && selected.category !== note.category) {
          const nextSection = this.sectionAfterCategoryChange(note);
          if (nextSection !== this.section()) {
            this.section.set(nextSection);
            this.searchQuery.set('');
          }
        }
        this.loadNotes(note.id);
      },
      error: () => {
        this.saving.set(false);
        this.operationError.set('Your note could not be saved. Please try again.');
      },
    });
  }

  confirmDelete(note: Note | null = this.selectedNote()): void {
    if (!note || this.saving()) {
      return;
    }

    this.dialog
      .open(DeleteConfirmationDialogComponent, {
        data: { title: note.title },
        panelClass: 'notely-dialog-panel',
        backdropClass: 'notely-dialog-backdrop',
      })
      .afterClosed()
      .subscribe((confirmed: boolean | undefined) => {
        if (confirmed) {
          this.deleteNote(note);
        }
      });
  }

  backToList(): void {
    this.mobileEditorOpen.set(false);
  }

  retryLoad(): void {
    this.loadNotes();
  }

  toggleFavorite(note: Note): void {
    this.runNoteAction(
      note,
      this.notesService.setFavorite(note.id, !note.isFavorite),
      'Your favorite could not be updated. Please try again.',
    );
  }

  archiveNote(note: Note): void {
    this.runNoteAction(
      note,
      this.notesService.archiveNote(note.id),
      'Your note could not be archived. Please try again.',
    );
  }

  restoreNote(note: Note): void {
    this.runNoteAction(
      note,
      this.notesService.restoreNote(note.id),
      'Your note could not be restored. Please try again.',
    );
  }

  private deleteNote(note: Note): void {
    this.saving.set(true);
    this.operationError.set(null);

    this.notesService.deleteNote(note.id).subscribe({
      next: () => {
        this.saving.set(false);
        if (this.selectedNote()?.id === note.id) {
          this.selectedNote.set(null);
          this.editorMode.set('empty');
          this.mobileEditorOpen.set(false);
        }
        this.loadNotes();
      },
      error: () => {
        this.saving.set(false);
        this.operationError.set('Your note could not be deleted. Please try again.');
      },
    });
  }

  private runNoteAction(note: Note, request: Observable<Note>, errorMessage: string): void {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.operationError.set(null);

    request.subscribe({
      next: (updatedNote) => {
        this.saving.set(false);
        if (this.selectedNote()?.id === updatedNote.id) {
          this.selectedNote.set(updatedNote);
        }
        this.loadNotes(updatedNote.id);
      },
      error: () => {
        this.saving.set(false);
        this.operationError.set(errorMessage);
      },
    });
  }

  private loadNotes(preferredId?: number): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.notesService.getNotes(this.filterForSection(this.section())).subscribe({
      next: (notes) => {
        const sortedNotes = [...notes].sort(
          (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
        );
        this.notes.set(sortedNotes);

        if (this.editorMode() !== 'create') {
          const currentId = preferredId ?? this.selectedNote()?.id;
          const selected =
            (currentId === undefined
              ? undefined
              : sortedNotes.find((note) => note.id === currentId)) ??
            sortedNotes[0] ??
            null;

          this.selectedNote.set(selected);
          this.editorMode.set(selected ? 'view' : 'empty');
        }

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('Could not load notes. Check that the backend is running, then retry.');
      },
    });
  }

  private filterForSection(section: NotesSection): NoteListFilter {
    switch (section) {
      case 'favorites':
        return { view: 'favorites' };
      case 'archive':
        return { view: 'archive' };
      case 'journal':
        return { category: 'JOURNAL' };
      case 'research':
        return { category: 'RESEARCH' };
      case 'drafts':
        return { category: 'DRAFT' };
      default:
        return {};
    }
  }

  private sectionAfterCategoryChange(note: Note): NotesSection {
    switch (this.section()) {
      case 'all':
      case 'journal':
      case 'research':
      case 'drafts':
        if (note.isArchived) {
          return 'archive';
        }

        switch (note.category) {
          case 'GENERAL':
            return 'all';
          case 'JOURNAL':
            return 'journal';
          case 'RESEARCH':
            return 'research';
          case 'DRAFT':
            return 'drafts';
        }
      default:
        return this.section();
    }
  }
}
