import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation, inject, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
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
import { AddGoalModalComponent } from '../dashboardClient/modals/add-goal-modal/add-goal-modal.component';
import { ProfileCategoryService } from 'src/app/core/services/ProfileCategory.service';
import { ProfileDomainService } from 'src/app/core/services/ProfileDomain.service';
import { ProfileItemService } from 'src/app/core/services/ProfileItem.service';
import { ProfileCategory } from 'src/app/core/models/ProfileCategory';
import { ProfileDomain } from 'src/app/core/models/ProfileDomain';
import { ProfileItem } from 'src/app/core/models/ProfileItem';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
  imports: [CommonModule, FormsModule, FullCalendarModule, AddGoalModalComponent],
})
export class CalendarComponent implements OnInit, OnChanges {
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
    eventsSet: this.handleEvents.bind(this),
    firstDay: 1 // Set Monday as the first day of the week
  };
  currentMonth: string = new Date().toLocaleString('default', { month: 'long' });
  events: Event[] = [];
  @Input() goals: any[] = [];
  @Input() inProgressDomains: any[] = [];
  @Output() addGoalRequested = new EventEmitter<string>();
  @Output() goalSaved = new EventEmitter<void>();
  showGoalFormModal = false;
  selectedGoalDate: string | null = null;
  categories: ProfileCategory[] = [];
  domains: { [categoryId: number]: ProfileDomain[] } = {};
  // Computed property to filter categories with domains
  get filteredCategories(): ProfileCategory[] {
    return this.categories.filter(category => (this.domains[category.id!] || []).length > 0);
  }

  // Get only domains in progress (acquis_percentage < 100)
  get inProgressDomainsList(): ProfileDomain[] {
    let result: ProfileDomain[] = [];
    for (const cat of this.filteredCategories) {
      result = result.concat((this.domains[cat.id!] || []).filter(domain => (domain.acquis_percentage || 0) < 100));
    }
    return result;
  }

  items: { [domainId: number]: ProfileItem[] } = {};
  currentProfileId: number | null = null;

  todayPlans = [
    { title: 'Atelier de communication', time: '10:00 - 11:30', progress: 75 },
    { title: 'Exercices sensoriels', time: '13:00 - 14:00', progress: 50 },
    { title: 'Activité artistique', time: '15:30 - 16:30', progress: 90 },
  ];
  
  constructor(
    private categoryService: ProfileCategoryService,
    private domainService: ProfileDomainService,
    private itemService: ProfileItemService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.updateCalendarEvents();
    // Get childId from route if present, else fallback to user id
    const childIdParam = this.route.snapshot.paramMap.get('childId');
    if (childIdParam) {
      this.currentProfileId = Number(childIdParam);
    } else {
      const user = localStorage.getItem('user');
      this.currentProfileId = user ? Number(JSON.parse(user).id) : null;
    }
    if (this.currentProfileId) {
      this.loadCategories(this.currentProfileId);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["goals"] && !changes["goals"].firstChange) {
      this.updateCalendarEvents();
    }
  }

  updateCalendarEvents() {
    if (this.goals && this.goals.length > 0) {
      this.calendarOptions.events = this.goals.map(goal => ({
        id: goal.id?.toString() ?? '',
        title: goal.title,
        start: goal.target_date,
        allDay: true
      }));
    } else {
      this.calendarOptions.events = [];
    }
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
    this.selectedGoalDate = selectInfo.startStr;
    this.showGoalFormModal = true;
    selectInfo.view.calendar.unselect();
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

  onGoalModalClose() {
    this.showGoalFormModal = false;
    this.selectedGoalDate = null;
  }

  onGoalModalSaved(goal: any) {
    this.showGoalFormModal = false;
    this.selectedGoalDate = null;
    this.goalSaved.emit();
  }

  loadCategories(profileId: number) {
    this.categoryService.getCategories(profileId).subscribe({
      next: (categories) => {
        this.categories = categories;
        categories.forEach((category) => {
          this.loadDomains(category.id!);
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement des catégories:', err);
      }
    });
  }

  loadDomains(categoryId: number) {
    this.domainService.getDomainsWithSpecificItems(categoryId).subscribe({
      next: (domains) => {
        this.domains[categoryId] = domains.map((domain) => ({
          ...domain,
          progress: domain.acquis_percentage || 0,
          start_date: domain.start_date || new Date().toISOString().split('T')[0],
          last_eval_date: domain.last_eval_date || new Date().toISOString().split('T')[0]
        }));
      },
      error: (err) => {
        console.error('Erreur lors du chargement des domaines:', err);
      }
    });
  }

  loadItems(domainId: number) {
    this.itemService.getItems(domainId).subscribe({
      next: (items) => {
        this.items[domainId] = items;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des items:', err);
      }
    });
  }

  getCategoryProgress(categoryId: number): number {
    const domains = this.domains[categoryId] || [];
    if (domains.length === 0) return 0;
    const totalProgress = domains.reduce((sum, domain) => sum + (domain.acquis_percentage || 0), 0);
    return Math.round(totalProgress / domains.length);
  }

  calculateAge(birthDate: string): string {
    if (!birthDate) return 'Âge inconnu';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} ans`;
  }

  // Helper: does this category have at least one in-progress domain?
  hasInProgressDomains(categoryId: number): boolean {
    return (this.domains[categoryId] || []).some(domain => (domain.acquis_percentage || 0) < 100);
  }

  // Helper: how many in-progress domains in this category?
  getInProgressDomainsCount(categoryId: number): number {
    return (this.domains[categoryId] || []).filter(domain => (domain.acquis_percentage || 0) < 100).length;
  }

  // Helper: get all in-progress domains for this category
  getInProgressDomains(categoryId: number): ProfileDomain[] {
    return (this.domains[categoryId] || []).filter(domain => (domain.acquis_percentage || 0) < 100);
  }
}
