import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Strategy } from 'src/app/core/models/strategy';
import { AddStrategyModalComponent } from '../../modals/add-strategy-modal/add-strategy-modal.component';
import { Subscription } from 'rxjs';
import { StrategyService } from 'src/app/core/services/strategy.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';



@Component({
  selector: 'app-strategy',
  standalone: true,
  imports: [CommonModule, AddStrategyModalComponent, TranslateModule],
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
  private languageSubscription: Subscription;

  constructor(
    private strategyService: StrategyService,
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
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
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

    if (confirm(this.translate.instant('dashboard_tabs.strategy.messages.confirm_delete'))) {
      this.deleteSubscription = this.strategyService.deleteStrategy(id).subscribe({
        next: () => {
          this.strategies = this.strategies.filter(s => s.id !== id);
        },
        error: (error) => {
          console.error('Error deleting strategy:', error);
          if (error.status === 403) {
            alert(this.translate.instant('dashboard_tabs.strategy.messages.permission_denied'));
          } else {
            alert(this.translate.instant('dashboard_tabs.strategy.messages.delete_error'));
          }
        }
      });
    }
  }
}
