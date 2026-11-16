import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Note, NotesSection } from '../../models/note.model';

@Component({
  selector: 'app-notes-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './notes-list.component.html',
  styleUrl: './notes-list.component.css',
})
export class NotesListComponent {
  @Input() notes: Note[] = [];
  @Input() selectedId: number | null = null;
  @Input() section: NotesSection = 'all';
  @Input() query = '';
  @Input() loading = false;
  @Input() error: string | null = null;

  @Output() readonly noteSelected = new EventEmitter<Note>();
  @Output() readonly queryChanged = new EventEmitter<string>();
  @Output() readonly createNote = new EventEmitter<void>();
  @Output() readonly retry = new EventEmitter<void>();
  @Output() readonly favoriteToggled = new EventEmitter<Note>();
  @Output() readonly archiveRequested = new EventEmitter<Note>();
  @Output() readonly restoreRequested = new EventEmitter<Note>();
  @Output() readonly deleteRequested = new EventEmitter<Note>();

  get sectionTitle(): string {
    return {
      all: 'All notes',
      favorites: 'Favorites',
      archive: 'Archive',
      journal: 'Journal',
      research: 'Research',
      drafts: 'Drafts',
    }[this.section];
  }

  get emptyTitle(): string {
    return {
      all: 'Your notebook is quiet.',
      favorites: 'No favorites yet.',
      archive: 'Your archive is empty.',
      journal: 'No journal entries yet.',
      research: 'No research notes yet.',
      drafts: 'No drafts yet.',
    }[this.section];
  }

  get emptyDescription(): string {
    return {
      all: 'Create a note to start collecting your thoughts.',
      favorites: 'Mark a note as a favorite and it will appear here.',
      archive: 'Archived notes will be kept here until you restore or delete them.',
      journal: 'Choose Journal when creating or editing a note.',
      research: 'Choose Research when creating or editing a note.',
      drafts: 'Choose Draft when creating or editing a note.',
    }[this.section];
  }

  categoryLabel(note: Note): string {
    return note.category.charAt(0) + note.category.slice(1).toLowerCase();
  }

  stopCardClick(event: Event): void {
    event.stopPropagation();
  }
}
