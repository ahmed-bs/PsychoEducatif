import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
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
  @Output() toggleSubObjectiveStatus = new EventEmitter<{ goalId: number; subObjectiveId: number; newStatus: boolean }>();
  @Output() deleteGoalClicked = new EventEmitter<number>();

  private languageSubscription: Subscription;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private sharedService: SharedService
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

  getSubObjectiveTooltip(goal: any): string {
    if (!this.isQuizAvailable(goal)) {
      return this.translate.instant('dashboard_tabs.goals.messages.sub_objective_disabled', { date: this.formatDate(goal.target_date) });
    }
    return '';
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

  onToggleSubObjective(goalId: number, subObjectiveId: number, currentStatus: boolean): void {
    this.toggleSubObjectiveStatus.emit({
      goalId: goalId,
      subObjectiveId: subObjectiveId,
      newStatus: !currentStatus
    });
  }

  onDeleteGoalClick(goalId: number): void {
    if (confirm(this.translate.instant('dashboard_tabs.goals.messages.confirm_delete'))) {
      this.deleteGoalClicked.emit(goalId);
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  calculateProgress(goal: any): number {
    if (!goal || !goal.sub_objectives || goal.sub_objectives.length === 0) {
      return 0;
    }

    const totalSubObjectives = goal.sub_objectives.length;
    const completedSubObjectives = goal.sub_objectives.filter((sub: any) => sub.is_completed).length;

    return Math.round((completedSubObjectives / totalSubObjectives) * 100);
  }

  getPriorityTranslation(priority: string): string {
    return this.translate.instant(`dashboard_tabs.goals.priority.${priority}`);
  }
}