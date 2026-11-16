import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NOTE_CATEGORIES, Note, NoteCategory, NoteDraft } from '../../models/note.model';

export type EditorMode = 'empty' | 'view' | 'edit' | 'create';

const nonBlank: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim().length > 0
    ? null
    : { blank: true };

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.css',
})
export class NoteEditorComponent implements OnChanges {
  @Input() note: Note | null = null;
  @Input() mode: EditorMode = 'empty';
  @Input() busy = false;
  @Input() errorMessage: string | null = null;

  @Output() readonly editRequested = new EventEmitter<void>();
  @Output() readonly saveRequested = new EventEmitter<NoteDraft>();
  @Output() readonly cancelRequested = new EventEmitter<void>();
  @Output() readonly deleteRequested = new EventEmitter<void>();
  @Output() readonly createRequested = new EventEmitter<void>();
  @Output() readonly backRequested = new EventEmitter<void>();
  @Output() readonly favoriteRequested = new EventEmitter<Note>();
  @Output() readonly archiveRequested = new EventEmitter<Note>();
  @Output() readonly restoreRequested = new EventEmitter<Note>();

  readonly categories = NOTE_CATEGORIES;

  readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [nonBlank, Validators.maxLength(255)],
    }),
    content: new FormControl('', {
      nonNullable: true,
      validators: [nonBlank],
    }),
    category: new FormControl<NoteCategory>('GENERAL', { nonNullable: true }),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['note'] || changes['mode']) {
      this.form.reset({
        title: this.note?.title ?? '',
        content: this.note?.content ?? '',
        category: this.note?.category ?? 'GENERAL',
      });
    }
  }

  categoryLabel(category: NoteCategory): string {
    return category.charAt(0) + category.slice(1).toLowerCase();
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy) {
      return;
    }

    this.saveRequested.emit(this.form.getRawValue());
  }
}
