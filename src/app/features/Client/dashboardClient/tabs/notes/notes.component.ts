import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core'; // Added OnChanges, SimpleChanges
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { Note } from 'src/app/core/models/note';
import { NoteFilterParams } from 'src/app/core/models/noteFiltesParams';
import { AuthService } from 'src/app/core/services/authService.service';
import { NoteService } from 'src/app/core/services/note.service';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.css'
})

export class NotesComponent implements OnInit, OnChanges {
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
  private searchSubject = new Subject<string>();
  private authorSearchSubject = new Subject<string>();

  constructor(
    private notesService: NoteService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.currentLoggedInUsername = this.authService.currentUserValue?.username || null;

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

  onSaveNote(): void {
    if (!this.newNoteContent.trim()) {
      alert('Note content cannot be empty!');
      return;
    }
    if (this.currentProfileId === null) {
      alert('Cannot save note: No profile selected.');
      return;
    }

    const noteToCreate: { content: string, is_important: boolean } = {
      content: this.newNoteContent,
      is_important: this.isImportantNote
    };

    this.notesService.createNote(this.currentProfileId, noteToCreate).subscribe({
      next: (createdNote) => {
        this.newNoteContent = '';
        this.isImportantNote = false;
        this.loadNotes();
      },
      error: (error) => {
        console.error('Error creating note:', error);
        if (error.status === 401) {
          alert('Authentication required. Please log in.');
        } else if (error.status === 403) {
          alert('You do not have permission to add notes to this profile.');
        } else {
          alert('Failed to save note. Please try again.');
        }
      }
    });
  }

  startEdit(note: Note): void {
    this.editingNoteId = note.id || null;
    this.editedNoteContent = note.content;
    this.editedIsImportant = note.is_important;
  }

  cancelEdit(): void {
    this.editingNoteId = null;
    this.editedNoteContent = '';
    this.editedIsImportant = false;
  }

  saveEditedNote(noteId: number | undefined): void {
    if (noteId === undefined || !this.editedNoteContent.trim()) {
      alert('Note ID is missing or content is empty!');
      return;
    }

    const updatedNote: Partial<Note> = {
      content: this.editedNoteContent,
      is_important: this.editedIsImportant
    };

    this.notesService.updateNote(noteId, updatedNote).subscribe({
      next: (response) => {
        const index = this.notes.findIndex(n => n.id === noteId);
        if (index !== -1) {
          this.notes[index] = { ...this.notes[index], ...response };
        }
        this.cancelEdit();
        this.loadNotes(); // Reload to ensure data consistency and potentially update author if needed
      },
      error: (error) => {
        console.error('Error updating note:', error);
        if (error.status === 401) {
          alert('Authentication required. Please log in to update notes.');
        } else if (error.status === 403) {
          alert('You do not have permission to edit this note.');
        } else {
          alert('Failed to update note. Please try again.');
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

  deleteNote(id: number | undefined): void {
    if (id === undefined || !confirm('Are you sure you want to delete this note?')) {
      return;
    }
    this.notesService.deleteNote(id).subscribe({
      next: () => {
        this.notes = this.notes.filter(note => note.id !== id);
      },
      error: (error) => {
        console.error('Error deleting note:', error);
        if (error.status === 403) {
          alert('You do not have permission to delete this note.');
        } else {
          alert('Failed to delete note. Please try again.');
        }
      }
    });
  }
}