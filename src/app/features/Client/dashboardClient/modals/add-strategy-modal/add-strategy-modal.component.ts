import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Strategy } from 'src/app/core/models/strategy';



@Component({
  selector: 'app-add-strategy-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './add-strategy-modal.component.html',
  styleUrls: ['./add-strategy-modal.component.css']
})

export class AddStrategyModalComponent implements OnInit {
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

  statusChoices: string[] = ['Actif', 'En cours', 'Terminé', 'En révision', 'Suspendu'];
  responsibleChoices: string[] = ['Tous les intervenants', 'Éducateur spécialisé', 'Psychologue', 'Orthophoniste', 'Parent'];


  ngOnInit(): void {
    this.initializeForm();
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
      alert('Veuillez remplir au moins le titre et la description de la stratégie.');
    }
  }

  onClose(): void {
    this.close.emit();
  }
}