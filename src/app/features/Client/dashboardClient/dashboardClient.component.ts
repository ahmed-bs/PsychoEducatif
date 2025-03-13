import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';

declare const ScrollReveal: any;
@Component({
  standalone: true,
  selector: 'app-dashboardClient',
  templateUrl: './dashboardClient.component.html',
  styleUrls: ['./dashboardClient.component.css'],
    imports: [CommonModule],

})
export class DashboardClientComponent implements OnInit {
 
  currentDate: Date = new Date();
  weeks: (Date | null)[][] = [];
  selectedDate: Date | null = null;

  ngOnInit() {
    this.generateCalendar();
  }

  generateCalendar() {
    const start = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const end = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);

    const dates: (Date | null)[] = [];
    for (let i = 0; i < start.getDay(); i++) {
      dates.push(null);
    }
    for (let i = 1; i <= end.getDate(); i++) {
      dates.push(new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), i));
    }

    this.weeks = [];
    while (dates.length) {
      this.weeks.push(dates.splice(0, 7));
    }
  }

  changeMonth(offset: number) {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + offset, 1);
    this.generateCalendar();
  }

  selectDate(date: Date | null) {
    this.selectedDate = date;
  }
}
