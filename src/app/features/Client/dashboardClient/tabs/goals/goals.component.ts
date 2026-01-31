import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { GoalService } from 'src/app/core/services/goal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './goals.component.html',
  styleUrl: './goals.component.css'
})
export class GoalsComponent implements OnInit, OnDestroy {
  @Input() goals: any[] = [];
  @Output() addGoalClicked = new EventEmitter<void>();
  @Output() editGoalClicked = new EventEmitter<any>();
  @Output() deleteGoalClicked = new EventEmitter<number>();

  sidebarOpen = false;
  showUpdateDateModal: boolean = false;
  goalToUpdate: any = null;
  updatingDate: boolean = false;
  showDeleteGoalModal: boolean = false;
  goalBeingDeleted: any = null;
  deletingGoal: boolean = false;
  private languageSubscription: Subscription;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private sharedService: SharedService,
    private goalService: GoalService
  ) {
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
    });
  }

  ngOnInit(): void {
    // Initialize translation with current language
    const currentLang = this.sharedService.getCurrentLanguage();
    this.translate.use(currentLang);
  }

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  isQuizAvailable(goal: any): boolean {
    if (!goal || !goal.target_date) {
      return false;
    }

    const today = new Date();
    const targetDate = new Date(goal.target_date);

    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    return today.getTime() >= targetDate.getTime();
  }

  getQuizAvailabilityMessage(goal: any): string {
    if (this.isQuizAvailable(goal)) {
      return this.translate.instant('dashboard_tabs.goals.messages.quiz_available');
    } else {
      return this.translate.instant('dashboard_tabs.goals.messages.quiz_not_available', { date: this.formatDate(goal.target_date) });
    }
  }

  onGoalClick(goal: any): void {
    if (!this.isQuizAvailable(goal)) {
      alert(this.translate.instant('dashboard_tabs.goals.messages.quiz_not_available', { date: this.formatDate(goal.target_date) }));
      return;
    }

    // Check if goal has repetition type (not "none")
    if (this.hasRepetition(goal)) {
      // Show confirmation modal to update target date
      this.goalToUpdate = goal;
      this.showUpdateDateModal = true;
    } else {
      // No repetition, navigate directly
      this.navigateToQuiz(goal);
    }
  }

  closeUpdateDateModal(): void {
    this.showUpdateDateModal = false;
    this.goalToUpdate = null;
    this.updatingDate = false;
  }

  confirmUpdateTargetDate(): void {
    if (!this.goalToUpdate || !this.goalToUpdate.id || this.updatingDate) {
      return;
    }

    // Save goal reference before closing modal
    const goalToNavigate = this.goalToUpdate;
    this.updatingDate = true;
    this.goalService.updateTargetDate(this.goalToUpdate.id).subscribe({
      next: () => {
        this.updatingDate = false;
        this.closeUpdateDateModal();
        // Navigate to quiz after updating date
        this.navigateToQuiz(goalToNavigate);
      },
      error: (error) => {
        this.updatingDate = false;
        console.error('Error updating target date:', error);
        alert(this.translate.instant('dashboard_tabs.goals.messages.update_date_failed'));
      }
    });
  }

  cancelUpdateTargetDate(): void {
    // User cancelled, navigate to quiz without updating date
    if (this.goalToUpdate) {
      this.closeUpdateDateModal();
      this.navigateToQuiz(this.goalToUpdate);
    }
  }

  private navigateToQuiz(goal: any): void {
    const domainId = goal.domain.id;

    if (domainId) {
      this.router.navigate(['/Dashboard-client/client/quiz', domainId]);
    } else {
      console.warn('Cannot navigate to quiz: domain ID not found for this goal.', goal);
      alert(this.translate.instant('dashboard_tabs.goals.messages.cannot_navigate_quiz'));
    }
  }

  onAddGoalClick(): void {
    this.addGoalClicked.emit();
  }

  onEditGoalClick(goal: any): void {
    this.editGoalClicked.emit(goal);
  }

  onDeleteGoalClick(goal: any): void {
    this.goalBeingDeleted = goal;
    this.showDeleteGoalModal = true;
  }

  closeDeleteGoalModal(): void {
    this.showDeleteGoalModal = false;
    this.goalBeingDeleted = null;
    this.deletingGoal = false;
  }

  confirmDeleteGoal(): void {
    if (!this.goalBeingDeleted || !this.goalBeingDeleted.id || this.deletingGoal) {
      return;
    }

    this.deletingGoal = true;
    this.deleteGoalClicked.emit(this.goalBeingDeleted.id);
    // Note: The actual deletion is handled by the parent component
    // After deletion, the parent should refresh the goals list
    // We'll close the modal after a short delay to allow the parent to handle it
    setTimeout(() => {
      this.closeDeleteGoalModal();
    }, 100);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  getPriorityTranslation(priority: string): string {
    return this.translate.instant(`dashboard_tabs.goals.priority.${priority}`);
  }

  getRepetitionTypeTranslation(repetitionType: string): string {
    if (!repetitionType || repetitionType === 'none') {
      return '';
    }
    const key = `dashboard_tabs.goals.repetition_type.${repetitionType}`;
    const translation = this.translate.instant(key);
    // If translation returns the key itself, it means translation wasn't found
    return translation !== key ? translation : repetitionType;
  }

  getRepetitionTypeKey(repetitionType: string): string {
    if (!repetitionType || repetitionType === 'none') {
      return '';
    }
    return `dashboard_tabs.goals.repetition_type.${repetitionType}`;
  }

  hasRepetition(goal: any): boolean {
    return goal.repetition_type && goal.repetition_type !== 'none';
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  onGoalSaved(): void {
    // Emit event to parent to refresh goals
    this.addGoalClicked.emit();
  }
}