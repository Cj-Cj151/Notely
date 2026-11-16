import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

interface DeleteDialogData {
  title: string;
}

@Component({
  selector: 'app-delete-confirmation-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Delete this note?</h2>
    <mat-dialog-content>
      <p><strong>{{ data.title }}</strong> will be permanently removed.</p>
      <p>This action can’t be undone.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancel</button>
      <button mat-flat-button class="confirm-delete" [mat-dialog-close]="true">Delete permanently</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      :host {
        display: block;
        color: #e4e8ef;
      }

      h2 {
        margin: 0;
        color: #f2f1ed;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 28px;
        font-weight: 400;
        line-height: 1.25;
      }

      mat-dialog-content {
        max-width: min(360px, calc(100vw - 64px));
        padding-top: 14px;
        color: #a8b0be;
        font-size: 16px;
        line-height: 1.55;
      }

      mat-dialog-content p {
        margin: 0 0 8px;
      }

      mat-dialog-content strong {
        color: #e4e8ef;
        font-weight: 500;
      }

      .confirm-delete {
        color: #fff !important;
        background: #754348 !important;
        border-radius: 2px !important;
      }
    `,
  ],
})
export class DeleteConfirmationDialogComponent {
  readonly data = inject<DeleteDialogData>(MAT_DIALOG_DATA);
}
