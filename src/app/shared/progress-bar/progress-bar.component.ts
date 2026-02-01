import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.css']
})
export class ProgressBarComponent implements OnChanges {
  @Input() acquisPercentage: number = 0;
  @Input() mode: 'circle' | 'line' = 'circle';
  isComplete: boolean = false;

  ngOnChanges(): void {
    // Round to 2 decimal places and ensure it's between 0-100
    this.acquisPercentage = Math.min(100, Math.max(0, parseFloat(this.acquisPercentage.toFixed(2))));
    this.isComplete = this.acquisPercentage === 100;
  }
}