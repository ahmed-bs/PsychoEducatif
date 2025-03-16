import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-evaluations',
  templateUrl: './evaluations.component.html',
  styleUrls: ['./evaluations.component.css']
})
export class EvaluationsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }
  communicationSkills: any[] = [];
  autonomySkills: any[] = [];

  addRow(type: 'communication' | 'autonomy'): void {
    const newRow = { skill: '', eval1: '', eval2: '', comments: '' };
    if (type === 'communication') {
      this.communicationSkills.push(newRow);
    } else {
      this.autonomySkills.push(newRow);
    }
  }
}
