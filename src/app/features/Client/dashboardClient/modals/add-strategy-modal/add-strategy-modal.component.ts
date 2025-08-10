import { Component, EventEmitter, Input, OnChanges, OnInit, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';
import { Strategy } from 'src/app/core/models/strategy';



@Component({
  selector: 'app-add-strategy-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './add-strategy-modal.component.html',
  styleUrls: ['./add-strategy-modal.component.css']
})

export class AddStrategyModalComponent implements OnInit, OnDestroy {
  @Input() isVisible: boolean = false;
  @Input() strategyToEdit: Strategy | null = null;
  @Input() currentProfileId: number | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() strategySaved = new EventEmitter<Strategy>();

  localStrategy: Strategy = {
    profile: 0,
    title: '',
    description: '',
    status: 'Actif',
    responsible: 'Tous les intervenants'
  };

  statusChoices: any[] = [];
  responsibleChoices: any[] = [];
  private languageSubscription: Subscription;

  constructor(
    private translate: TranslateService,
    private sharedService: SharedService
  ) {
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
      this.updateChoices();
    });

    // Initialize choices
    this.updateChoices();
  }


  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  private updateChoices(): void {
    this.statusChoices = [
      { label: this.translate.instant('add_strategy_modal.status_options.active'), value: 'Actif' },
      { label: this.translate.instant('add_strategy_modal.status_options.in_progress'), value: 'En cours' },
      { label: this.translate.instant('add_strategy_modal.status_options.completed'), value: 'Terminé' },
      { label: this.translate.instant('add_strategy_modal.status_options.under_review'), value: 'En révision' },
      { label: this.translate.instant('add_strategy_modal.status_options.suspended'), value: 'Suspendu' }
    ];

    this.responsibleChoices = [
      { label: this.translate.instant('add_strategy_modal.responsible_options.all_interveners'), value: 'Tous les intervenants' },
      { label: this.translate.instant('add_strategy_modal.responsible_options.special_educator'), value: 'Éducateur spécialisé' },
      { label: this.translate.instant('add_strategy_modal.responsible_options.psychologist'), value: 'Psychologue' },
      { label: this.translate.instant('add_strategy_modal.responsible_options.speech_therapist'), value: 'Orthophoniste' },
      { label: this.translate.instant('add_strategy_modal.responsible_options.parent'), value: 'Parent' }
    ];
  }

  initializeForm(): void {
    if (this.strategyToEdit) {
      this.localStrategy = { ...this.strategyToEdit };
    } else {
      this.localStrategy = {
        profile: this.currentProfileId as number,
        title: '',
        description: '',
        status: 'Actif',
        responsible: 'Tous les intervenants'
      };
    }
  }

  onSave(): void {
    if (this.localStrategy.title && this.localStrategy.description && this.localStrategy.profile) {
      this.strategySaved.emit(this.localStrategy);
    } else {
      alert(this.translate.instant('add_strategy_modal.validation.required_fields'));
    }
  }

  onClose(): void {
    this.close.emit();
  }
}