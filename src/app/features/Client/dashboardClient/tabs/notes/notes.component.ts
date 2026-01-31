import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core'; // Added OnChanges, SimpleChanges
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { Note } from 'src/app/core/models/note';
import { NoteFilterParams } from 'src/app/core/models/noteFiltesParams';
import { AuthService } from 'src/app/core/services/authService.service';
import { NoteService } from 'src/app/core/services/note.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.css'
})

export class NotesComponent implements OnInit, OnChanges, OnDestroy {
  @Input() currentProfileId: number | null = null;

  notes: Note[] = [];
  newNoteContent: string = '';
  isImportantNote: boolean = false;
  loadingNotes: boolean = true;
  currentLoggedInUsername: string | null = null;

  editingNoteId: number | null = null;
  editedNoteContent: string = '';
  editedIsImportant: boolean = false;

  filterSearchTerm: string = '';
  filterImportant: boolean | null = null;
  filterStartDate: string = '';
  filterEndDate: string = '';
  filterAuthorUsername: string = '';
  isSidebarOpen: boolean = false;
  showAddNoteModal: boolean = false;
  showEditNoteModal: boolean = false;
  noteBeingEdited: Note | null = null;
  showDeleteNoteModal: boolean = false;
  noteBeingDeleted: Note | null = null;
  savingNote: boolean = false;
  private searchSubject = new Subject<string>();
  private authorSearchSubject = new Subject<string>();
  private languageSubscription: Subscription;

  constructor(
    private notesService: NoteService,
    private authService: AuthService,
    private translate: TranslateService,
    private sharedService: SharedService
  ) {
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
    });
  }

  ngOnInit(): void {
    this.currentLoggedInUsername = this.authService.currentUserValue?.username || null;

    // Initialize translation with current language
    const currentLang = this.sharedService.getCurrentLanguage();
    this.translate.use(currentLang);

    if (this.currentProfileId) {
      this.loadNotes();
    }

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadNotes();
    });

    this.authorSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadNotes();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentProfileId'] && this.currentProfileId !== null) {
      this.loadNotes();
    }
  }

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  loadNotes(): void {
    if (this.currentProfileId === null) {
      console.warn('Cannot load notes: currentProfileId is null.');
      this.notes = [];
      this.loadingNotes = false;
      return;
    }

    this.loadingNotes = true;
    const filters: NoteFilterParams = {};

    if (this.filterSearchTerm) {
      filters.search = this.filterSearchTerm;
    }
    if (this.filterImportant !== null) {
      filters.important = this.filterImportant;
    }
    if (this.filterStartDate) {
      filters.startDate = this.filterStartDate;
    }
    if (this.filterEndDate) {
      filters.endDate = this.filterEndDate;
    }
    if (this.filterAuthorUsername) {
      filters.authorUsername = this.filterAuthorUsername;
    }

    // --- UPDATED: Pass currentProfileId to the service ---
    this.notesService.getNotes(this.currentProfileId, filters).subscribe({
      next: (data) => {
        this.notes = data;
        this.loadingNotes = false;
      },
      error: (error) => {
        console.error('Error fetching notes:', error);
        this.loadingNotes = false;
      }
    });
  }

  onSearchInputChange(): void {
    this.searchSubject.next(this.filterSearchTerm);
  }

  onImportanceFilterChange(value: string): void {
    if (value === 'all') {
      this.filterImportant = null;
    } else if (value === 'true') {
      this.filterImportant = true;
    } else if (value === 'false') {
      this.filterImportant = false;
    }
    this.loadNotes();
  }

  onStartDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filterStartDate = input.value;
    this.loadNotes();
  }

  onEndDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filterEndDate = input.value;
    this.loadNotes();
  }

  onAuthorUsernameChange(): void {
    this.authorSearchSubject.next(this.filterAuthorUsername);
  }

  clearFilters(): void {
    this.filterSearchTerm = '';
    this.filterImportant = null;
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.filterAuthorUsername = '';
    this.searchSubject.next('');
    this.authorSearchSubject.next('');
    this.loadNotes();
  }

  openAddNoteModal(): void {
    this.showAddNoteModal = true;
  }

  closeAddNoteModal(): void {
    this.showAddNoteModal = false;
    // Reset form when closing
    this.newNoteContent = '';
    this.isImportantNote = false;
    this.savingNote = false;
  }

  onSaveNote(): void {
    if (!this.newNoteContent.trim()) {
      alert(this.translate.instant('dashboard_tabs.notes.messages.content_empty'));
      return;
    }
    if (this.currentProfileId === null) {
      alert(this.translate.instant('dashboard_tabs.notes.messages.no_profile_selected'));
      return;
    }
    if (this.savingNote) {
      return; // Prevent multiple submissions
    }

    this.savingNote = true;
    const noteToCreate: { content: string, is_important: boolean } = {
      content: this.newNoteContent,
      is_important: this.isImportantNote
    };

    this.notesService.createNote(this.currentProfileId, noteToCreate).subscribe({
      next: (createdNote) => {
        this.savingNote = false;
        this.newNoteContent = '';
        this.isImportantNote = false;
        this.closeAddNoteModal();
        this.loadNotes();
      },
      error: (error) => {
        this.savingNote = false;
        console.error('Error creating note:', error);
        if (error.status === 401) {
          alert(this.translate.instant('dashboard_tabs.notes.messages.auth_required'));
        } else if (error.status === 403) {
          alert(this.translate.instant('dashboard_tabs.notes.messages.permission_denied_add'));
        } else {
          alert(this.translate.instant('dashboard_tabs.notes.messages.save_failed'));
        }
      }
    });
  }

  startEdit(note: Note): void {
    this.noteBeingEdited = note;
    this.editingNoteId = note.id || null;
    this.editedNoteContent = note.content;
    this.editedIsImportant = note.is_important;
    this.showEditNoteModal = true;
  }

  cancelEdit(): void {
    this.showEditNoteModal = false;
    this.editingNoteId = null;
    this.editedNoteContent = '';
    this.editedIsImportant = false;
    this.noteBeingEdited = null;
    this.savingNote = false;
  }

  closeEditNoteModal(): void {
    this.cancelEdit();
  }

  saveEditedNote(noteId: number | undefined): void {
    if (noteId === undefined || !this.editedNoteContent.trim()) {
      alert(this.translate.instant('dashboard_tabs.notes.messages.note_id_missing'));
      return;
    }
    if (this.savingNote) {
      return; // Prevent multiple submissions
    }

    this.savingNote = true;
    const updatedNote: Partial<Note> = {
      content: this.editedNoteContent,
      is_important: this.editedIsImportant
    };

    this.notesService.updateNote(noteId, updatedNote).subscribe({
      next: (response) => {
        this.savingNote = false;
        const index = this.notes.findIndex(n => n.id === noteId);
        if (index !== -1) {
          this.notes[index] = { ...this.notes[index], ...response };
        }
        this.closeEditNoteModal();
        this.loadNotes(); // Reload to ensure data consistency and potentially update author if needed
      },
      error: (error) => {
        this.savingNote = false;
        console.error('Error updating note:', error);
        if (error.status === 401) {
          alert(this.translate.instant('dashboard_tabs.notes.messages.auth_required_update'));
        } else if (error.status === 403) {
          alert(this.translate.instant('dashboard_tabs.notes.messages.permission_denied_edit'));
        } else {
          alert(this.translate.instant('dashboard_tabs.notes.messages.update_failed'));
        }
      }
    });
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  isNoteUpdated(note: Note): boolean {
    if (!note.created_at || !note.updated_at) {
      return false;
    }

    const createdAt = new Date(note.created_at);
    const updatedAt = new Date(note.updated_at);

    const timeDifferenceMs = updatedAt.getTime() - createdAt.getTime();

    // Threshold to consider it updated (e.g., more than a few seconds difference)
    const thresholdMs = 2000; // 2 seconds

    return timeDifferenceMs > thresholdMs;
  }

  openDeleteModal(note: Note): void {
    this.noteBeingDeleted = note;
    this.showDeleteNoteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteNoteModal = false;
    this.noteBeingDeleted = null;
  }

  confirmDeleteNote(): void {
    if (!this.noteBeingDeleted || !this.noteBeingDeleted.id) {
      return;
    }

    const noteId = this.noteBeingDeleted.id;
    this.notesService.deleteNote(noteId).subscribe({
      next: () => {
        this.notes = this.notes.filter(note => note.id !== noteId);
        this.closeDeleteModal();
      },
      error: (error) => {
        console.error('Error deleting note:', error);
        if (error.status === 403) {
          alert(this.translate.instant('dashboard_tabs.notes.messages.permission_denied_delete'));
        } else {
          alert(this.translate.instant('dashboard_tabs.notes.messages.delete_failed'));
        }
        this.closeDeleteModal();
      }
    });
  }

  getAuthorDisplayName(authorUsername: string | undefined): string {
    return authorUsername || this.translate.instant('dashboard_tabs.notes.unknown');
  }

  getAuthorText(authorUsername: string | undefined): string {
    const username = authorUsername || this.translate.instant('dashboard_tabs.notes.unknown');
    return this.translate.instant('dashboard_tabs.notes.by_other', { username });
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }
}