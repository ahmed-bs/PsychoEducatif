import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './goals.component.html',
  styleUrl: './goals.component.css'
})
export class GoalsComponent implements OnInit {
  @Input() goals: any[] = [];
  @Output() addGoalClicked = new EventEmitter<void>();
  @Output() editGoalClicked = new EventEmitter<any>();
  @Output() toggleSubObjectiveStatus = new EventEmitter<{ goalId: number; subObjectiveId: number; newStatus: boolean }>();
  @Output() deleteGoalClicked = new EventEmitter<number>();



  constructor(private router: Router) { }

  ngOnInit(): void {
    console.log('GoalsComponent received goals on init:', this.goals);
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
      return `Vous ne pouvez pas modifier le sous-objectif avant le ${this.formatDate(goal.target_date)}`;
    }
    return '';
  }

  getQuizAvailabilityMessage(goal: any): string {
    if (this.isQuizAvailable(goal)) {
      return 'Cliquez pour passer le quiz.';
    } else {
      return `Le quiz ne sera disponible qu'à partir du ${this.formatDate(goal.target_date)}.`;
    }
  }

  onGoalClick(goal: any): void {
    if (!this.isQuizAvailable(goal)) {
      alert(`Le quiz pour cet objectif ne sera disponible qu'à partir du ${this.formatDate(goal.target_date)}.`);
      return;
    }

    const domainId = goal.domain.id;

    if (domainId) {
      this.router.navigate(['/Dashboard-client/client/quiz', domainId]);
    } else {
      console.warn('Cannot navigate to quiz: domain ID not found for this goal.', goal);
      alert('Impossible de lancer le quiz : Le domaine de l\'objectif est introuvable.');
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
    if (confirm('Êtes-vous sûr de vouloir supprimer cet objectif et tous ses sous-objectifs ?')) {
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
}