import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
declare const ScrollReveal: any;
interface Content {
  name: string;
  code: string;
}

@Component({
  standalone: true,
  selector: 'app-dashboardClient',
  templateUrl: './dashboardClient.component.html',
  styleUrls: ['./dashboardClient.component.css'],
    imports: [CommonModule,FormsModule,DropdownModule ],

})
export class DashboardClientComponent implements OnInit {

  contents: Content[] | undefined;

  selectedContent: Content | undefined;


  currentDate: Date = new Date();
  weeks: (Date | null)[][] = [];
  selectedDate: Date | null = null;
  currentMonth: string = 'January';
  weekDays: string[] = (() => {
    const today = new Date();
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      days.push(day.toLocaleString('default', { weekday: 'short' }));
    }
    return days;
  })();
  firstWeekDays: number[] = (() => {
    const today = new Date();
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      days.push(day.getDate());
    }
    return days;
  })();
  currentDay: number = new Date().getDate(); // Get today's day number
  currentDaystr: string = new Date().toLocaleString('default', { weekday: 'short' });
  // Combine both weekDays and firstWeekDays into a single array of objects
  days = this.weekDays.map((weekday, index) => ({
    weekday: weekday,
    day: this.firstWeekDays[index]
  }));
  ngOnInit() {
    this.contents= [
      { name: 'Close', code: 'NY' },
      { name: 'Progress', code: 'RM' },
      { name: 'Panding', code: 'LDN' },
  ];
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
