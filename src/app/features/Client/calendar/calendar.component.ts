import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventApi, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { Event } from '../../../core/models/event';
import { EventService } from '../../../core/services/event.service';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
  imports: [CommonModule, FormsModule, FullCalendarModule],
})
export class CalendarComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  private eventService = inject(EventService);
  currentEvents: EventApi[] = [];
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    locale: 'fr',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    initialView: 'dayGridMonth',
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
  events: Event[] = [];

  todayPlans = [
    { title: 'Atelier de communication', time: '10:00 - 11:30', progress: 75 },
    { title: 'Exercices sensoriels', time: '13:00 - 14:00', progress: 50 },
    { title: 'Activité artistique', time: '15:30 - 16:30', progress: 90 },
  ];
  
  constructor() {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.eventService.getEvents().subscribe({
      next: (events: Event[]) => {
        this.events = events;
        this.calendarOptions.events = events.map((event: Event) => ({
          id: event.id?.toString() ?? '',
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.allDay
        }));
      },
      error: (error: Error) => {
        console.error('Error loading events:', error);
      }
    });
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    const title = prompt('Please enter a new title for your event');
    const calendarApi = selectInfo.view.calendar;

    calendarApi.unselect(); // clear date selection

    if (title) {
      const newEvent: Event = {
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay
      };

      this.eventService.createEvent(newEvent).subscribe({
        next: (createdEvent: Event) => {
          calendarApi.addEvent({
            id: createdEvent.id?.toString() ?? '',
            title: createdEvent.title,
            start: createdEvent.start,
            end: createdEvent.end,
            allDay: createdEvent.allDay
          });
        },
        error: (error: Error) => {
          console.error('Error creating event:', error);
        }
      });
    }
  }
  
  handleEventClick(clickInfo: EventClickArg) {
    if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
      const eventId = parseInt(clickInfo.event.id);
      this.eventService.deleteEvent(eventId).subscribe({
        next: () => {
          clickInfo.event.remove();
        },
        error: (error: Error) => {
          console.error('Error deleting event:', error);
        }
      });
    }
  }

  handleEvents(events: EventApi[]) {
    this.currentEvents = events;
  }
}
