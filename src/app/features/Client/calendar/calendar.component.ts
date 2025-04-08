import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import frLocale from '@fullcalendar/core/locales/fr'; // ✅ Import French locale

@Component({
  standalone: true,
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
  imports: [CommonModule, FormsModule, FullCalendarModule],
})
export class CalendarComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  calendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    locale: frLocale, 
    events: [
      { title: 'Réunion', date: '2025-04-10' },
      { title: 'Conférence', date: '2025-04-15' }
    ]
  };
  currentMonth: string = new Date().toLocaleString('default', { month: 'long' });

  todayPlans = [
    { title: 'Atelier de communication', time: '10:00 - 11:30', progress: 75 },
    { title: 'Exercices sensoriels', time: '13:00 - 14:00', progress: 50 },
    { title: 'Activité artistique', time: '15:30 - 16:30', progress: 90 },
  ];
  
  constructor() {}

  ngOnInit() {}

  planifierEvent() {
    alert('Planifier button clicked!');
  }

  changeView(view: string) {
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.changeView(view);
  }
}
