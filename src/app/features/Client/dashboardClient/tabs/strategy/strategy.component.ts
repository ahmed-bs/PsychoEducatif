import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Strategy } from 'src/app/core/models/strategy';
import { AddStrategyModalComponent } from '../../modals/add-strategy-modal/add-strategy-modal.component';
import { Subscription } from 'rxjs';
import { StrategyService } from 'src/app/core/services/strategy.service';



@Component({
  selector: 'app-strategy',
  standalone: true,
  imports: [CommonModule, AddStrategyModalComponent],
  templateUrl: './strategy.component.html',
  styleUrls: ['./strategy.component.css']
})

export class StrategyComponent implements OnInit, OnDestroy {
  @Input() currentProfileId: number | null = null;

  strategies: Strategy[] = [];
  showAddStrategyModal: boolean = false;
  strategyToEdit: Strategy | null = null;

  private strategiesSubscription: Subscription | undefined;
  private saveSubscription: Subscription | undefined;
  private deleteSubscription: Subscription | undefined;

  constructor(private strategyService: StrategyService) { }

  ngOnInit(): void {
    if (this.currentProfileId) {
      this.loadStrategies();
    } else {
      console.warn('StrategyComponent initialized without a currentProfileId. Cannot load strategies.');
    }
  }

  ngOnDestroy(): void {
    this.strategiesSubscription?.unsubscribe();
    this.saveSubscription?.unsubscribe();
    this.deleteSubscription?.unsubscribe();
  }
  
  loadStrategies(): void {
    if (this.currentProfileId) {
      this.strategiesSubscription = this.strategyService.getStrategies(this.currentProfileId).subscribe({
        next: (data) => {
          this.strategies = data;
        },
        error: (error) => {
          console.error('Error loading strategies:', error);
        }
      });
    }
  }

  openAddStrategyModal(): void {
    this.strategyToEdit = null;
    this.showAddStrategyModal = true;
  }

  openEditStrategyModal(strategy: Strategy): void {
    this.strategyToEdit = { ...strategy };
    this.showAddStrategyModal = true;
  }

  closeAddStrategyModal(): void {
    this.showAddStrategyModal = false;
    this.strategyToEdit = null;
  }

  onStrategySaved(savedStrategy: Strategy): void {
    if (savedStrategy.id) {
      this.saveSubscription = this.strategyService.updateStrategy(savedStrategy).subscribe({
        next: (updatedStrategy) => {
          const index = this.strategies.findIndex(s => s.id === updatedStrategy.id);
          if (index !== -1) {
            this.strategies[index] = updatedStrategy;
          }
          this.closeAddStrategyModal();
        },
        error: (error) => {
          console.error('Error updating strategy:', error);
        }
      });
    } else {
      const strategyToCreate: Omit<Strategy, 'id' | 'author' | 'created_at' | 'updated_at' | 'author_username' | 'profile_name'> = {
        ...savedStrategy,
        profile: this.currentProfileId as number
      };

      this.saveSubscription = this.strategyService.createStrategy(strategyToCreate).subscribe({
        next: (newStrategy) => {
          this.strategies.push(newStrategy);
          this.closeAddStrategyModal();
        },
        error: (error) => {
          console.error('Error creating strategy:', error);
        }
      });
    }
  }

  deleteStrategy(id: number | undefined): void {
    if (id === undefined) {
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir supprimer cette stratégie?')) {
      this.deleteSubscription = this.strategyService.deleteStrategy(id).subscribe({
        next: () => {
          this.strategies = this.strategies.filter(s => s.id !== id);
        },
        error: (error) => {
          console.error('Error deleting strategy:', error);
          if (error.status === 403) {
            alert('Vous n\'êtes pas autorisé à supprimer cette stratégie. Seul l\'auteur peut la supprimer.');
          } else {
            alert('Une erreur est survenue lors de la suppression de la stratégie.');
          }
        }
      });
    }
  }
}
