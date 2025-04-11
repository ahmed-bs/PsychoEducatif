import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventApi, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { createEventId, INITIAL_EVENTS } from 'src/app/core/models/event';
import Swal from 'sweetalert2';
encapsulation: ViewEncapsulation.None
@Component({
  standalone: true,
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
  imports: [CommonModule, FormsModule, FullCalendarModule],
})
export class CalendarComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  currentEvents: EventApi[] = [];
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    locale: frLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    initialView: 'dayGridMonth',
    initialEvents: INITIAL_EVENTS,
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventsSet: this.handleEvents.bind(this)
  };
  currentMonth: string = new Date().toLocaleString('default', { month: 'long' });

  todayPlans = [
    { title: 'Atelier de communication', time: '10:00 - 11:30', progress: 75 },
    { title: 'Exercices sensoriels', time: '13:00 - 14:00', progress: 50 },
    { title: 'Activité artistique', time: '15:30 - 16:30', progress: 90 },
  ];
  
  constructor() {}

  ngOnInit() {}

  // planifierEvent() {
  //   alert('Planifier button clicked!');
  // }

  // changeView(view: string) {
  //   const calendarApi = this.calendarComponent.getApi();
  //   calendarApi.changeView(view);
  // }

  
  handleDateSelect(selectInfo: DateSelectArg) {
    Swal.fire({
      title: 'Créer un nouvel événement',
      input: 'text',
      inputLabel: 'Titre de l’événement',
      inputPlaceholder: 'Entrez un titre',
      showCancelButton: true,
      confirmButtonText: 'Ajouter',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const calendarApi = selectInfo.view.calendar;
        calendarApi.unselect();
        calendarApi.addEvent({
          id: createEventId(),
          title: result.value,
          start: selectInfo.startStr,
          end: selectInfo.endStr,
          allDay: selectInfo.allDay
        });
      }
    });
  }
  
  handleEventClick(clickInfo: EventClickArg) {
    Swal.fire({
      title: 'Supprimer un événement',
      text: `Voulez-vous vraiment supprimer l'événement "${clickInfo.event.title}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        clickInfo.event.remove();
      }
    });
  }

  handleEvents(events: EventApi[]) {
    this.currentEvents = events;
  }



}
