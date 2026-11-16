import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { NotesSection } from '../../models/note.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  @Input() section: NotesSection = 'all';
  @Output() readonly createNote = new EventEmitter<void>();
  @Output() readonly sectionSelected = new EventEmitter<NotesSection>();

  mobileNavigationOpen = false;

  toggleMobileNavigation(): void {
    this.mobileNavigationOpen = !this.mobileNavigationOpen;
  }

  closeMobileNavigation(): void {
    this.mobileNavigationOpen = false;
  }
}
