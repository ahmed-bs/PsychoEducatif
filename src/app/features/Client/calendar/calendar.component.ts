import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation, inject, Input, Output, EventEmitter, SimpleChanges, OnChanges, OnDestroy } from '@angular/core';
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
import { GoalService } from 'src/app/core/services/goal.service';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';
import { TranslateService, TranslateModule } from '@ngx-translate/core'; 

@Component({
  standalone: true,
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
  imports: [CommonModule, FormsModule, FullCalendarModule, AddGoalModalComponent, TranslateModule],
})
export class CalendarComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  private eventService = inject(EventService);
  private goalService = inject(GoalService); 
  currentEvents: EventApi[] = [];
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    locale: 'ar',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    initialView: 'dayGridMonth',
    buttonText: this.getButtonText('ar'),
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventsSet: this.handleEvents.bind(this),
    firstDay: 1, // Start with Monday for consistency
    events: [], 
    
    eventContent: this.renderEventContent.bind(this)
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

  get categoriesFiltrees(): ProfileCategory[] {
    return this.categories.filter(category => (this.domains[category.id!] || []).length > 0);
  }

  get listeDomainesEnCours(): ProfileDomain[] {
    let result: ProfileDomain[] = [];
    for (const cat of this.categoriesFiltrees) {
      result = result.concat((this.domains[cat.id!] || []).filter(domain => (domain.acquis_percentage || 0) < 100));
    }
    return result;
  }

  items: { [domainId: number]: ProfileItem[] } = {};
  currentProfileId: number | null = null;
  currentLang: string = 'ar';
  private languageSubscription!: Subscription;

  plansDuJour = [
    { title: 'Atelier de communication', time: '10:00 - 11:30', progress: 75 },
    { title: 'Exercices sensoriels', time: '13:00 - 14:00', progress: 50 },
    { title: 'Activité artistique', time: '15:30 - 16:30', progress: 90 },
  ];

  constructor(
    private categoryService: ProfileCategoryService,
    private domainService: ProfileDomainService,
    private itemService: ProfileItemService,
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private translate: TranslateService
  ) {
    // Initialize current language
    this.currentLang = localStorage.getItem('lang') || 'ar';
  }

  ngOnInit(): void {
    const childIdParam = this.route.snapshot.paramMap.get('childId');
    if (childIdParam) {
      this.currentProfileId = Number(childIdParam);
    } else {
      const user = localStorage.getItem('user');
      this.currentProfileId = user ? Number(JSON.parse(user).id) : null;
    }

    if (this.currentProfileId) {
      this.chargerCategories(this.currentProfileId);
      this.chargerObjectifs(this.currentProfileId); 
    }

    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.currentLang = lang;
      this.updateCalendarLanguage(lang);
    });

    // Initialize calendar with current language
    this.updateCalendarLanguage(this.currentLang);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["goals"] && !changes["goals"].firstChange) {
      this.mettreAJourEvenementsCalendrier();
    }
  }

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  getButtonText(language: string): any {
    if (language === 'fr') {
      return {
        today: 'Aujourd\'hui',
        month: 'Mois',
        week: 'Semaine',
        day: 'Jour',
        list: 'Liste'
      };
    } else { // Arabic
      return {
        today: 'اليوم',
        month: 'شهر',
        week: 'أسبوع',
        day: 'يوم',
        list: 'قائمة'
      };
    }
  }

  updateCalendarLanguage(language: string): void {
    // Update calendar options with new language
    this.calendarOptions.locale = language;
    this.calendarOptions.buttonText = this.getButtonText(language);
    
    // Keep first day as Monday for consistency (French style)
    this.calendarOptions.firstDay = 1;
    
    // Update calendar if it's already initialized
    if (this.calendarComponent && this.calendarComponent.getApi()) {
      const calendarApi = this.calendarComponent.getApi();
      
      // Update locale
      calendarApi.setOption('locale', language);
      
      // Update button text
      calendarApi.setOption('buttonText', this.getButtonText(language));
      
      // Keep first day as Monday for consistency
      calendarApi.setOption('firstDay', 1);
      
      // Re-render to apply changes
      calendarApi.render();
    }
  }
  
  chargerObjectifs(profileId: number): void {
    this.goalService.getGoalsByProfile(profileId).subscribe({ 
      next: (goals: any[]) => {
        this.goals = goals; 
        this.mettreAJourEvenementsCalendrier(); 
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des objectifs:', error);
        Swal.fire(
          this.currentLang === 'ar' ? 'خطأ' : 'Erreur',
          this.currentLang === 'ar' ? 'فشل في تحميل الأهداف.' : 'Impossible de charger les objectifs.',
          'error'
        );
      }
    });
  }

  mettreAJourEvenementsCalendrier() {
    if (this.goals && this.goals.length > 0) {
      this.calendarOptions.events = this.goals.map(goal => ({
        id: goal.id?.toString() ?? '',
        title: goal.title,
        start: goal.target_date, 
        allDay: true,
        
        
      }));
    } else {
      this.calendarOptions.events = [];
    }
    
    if (this.calendarComponent && this.calendarComponent.getApi()) {
      this.calendarComponent.getApi().setOption('events', this.calendarOptions.events);
    }
  }

  
  renderEventContent(eventInfo: any) {
    const title = eventInfo.event.title;
    const element = document.createElement('div');
    element.innerHTML = eventInfo.timeText + ' ' + title; 
    element.setAttribute('title', title); 
    return { domNodes: [element] };
  }
  

  loadEvents(): void {
    this.eventService.getEvents().subscribe({
      next: (events: Event[]) => {
        this.events = events;
      },
      error: (error: Error) => {
        console.error('Erreur lors du chargement des événements:', error);
      }
    });
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    this.selectedGoalDate = selectInfo.startStr;
    this.showGoalFormModal = true;
    selectInfo.view.calendar.unselect();
  }

  handleEventClick(clickInfo: EventClickArg) {
    Swal.fire({
      title: this.currentLang === 'ar' ? 'تحذير' : 'Avertissement',
      text: this.currentLang === 'ar' ? 
        `هل أنت متأكد من حذف الهدف "${clickInfo.event.title}"؟` : 
        `Voulez-vous vraiment supprimer l'objectif "${clickInfo.event.title}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: this.currentLang === 'ar' ? 'نعم، احذف!' : 'Oui, supprimer!',
      cancelButtonText: this.currentLang === 'ar' ? 'إلغاء' : 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        const goalId = parseInt(clickInfo.event.id);
        this.goalService.deleteGoal(goalId).subscribe({ 
          next: () => {
            clickInfo.event.remove(); 
            Swal.fire(
              this.currentLang === 'ar' ? 'تم الحذف!' : 'Supprimé!',
              this.currentLang === 'ar' ? 'تم حذف الهدف بنجاح.' : 'L\'objectif a été supprimé.',
              'success'
            );
            if (this.currentProfileId) {
              this.chargerObjectifs(this.currentProfileId); 
            }
          },
          error: (error: any) => {
            console.error('Erreur lors de la suppression de l\'objectif:', error);
            Swal.fire(
              this.currentLang === 'ar' ? 'خطأ!' : 'Erreur!',
              this.currentLang === 'ar' ? 
                'حدث خطأ أثناء حذف الهدف.' : 
                'Une erreur s\'est produite lors de la suppression de l\'objectif.',
              'error'
            );
          }
        });
      }
    });
  }

  handleEvents(events: EventApi[]) {
    this.currentEvents = events;
  }

  surFermetureModaleObjectif() {
    this.showGoalFormModal = false;
    this.selectedGoalDate = null;
  }

  surSauvegardeModaleObjectif(goal: any) {
    this.showGoalFormModal = false;
    this.selectedGoalDate = null;
    this.goalSaved.emit(); 
    if (this.currentProfileId) {
      this.chargerObjectifs(this.currentProfileId); 
    }
    Swal.fire({
      icon: 'success',
      title: this.currentLang === 'ar' ? 'تم الحفظ!' : 'Objectif enregistré!',
      text: this.currentLang === 'ar' ? 
        `تم إضافة الهدف "${goal.title}" بنجاح.` : 
        `L'objectif "${goal.title}" a été ajouté avec succès.`,
      timer: 2000,
      showConfirmButton: false
    });
  }

  chargerCategories(profileId: number) {
    this.categoryService.getCategories(profileId).subscribe({
      next: (categories) => {
        this.categories = categories;
        categories.forEach((category) => {
          this.chargerDomaines(category.id!);
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement des catégories:', err);
      }
    });
  }

  chargerDomaines(categoryId: number) {
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

  chargerItems(domainId: number) {
    this.itemService.getItems(domainId).subscribe({
      next: (items) => {
        this.items[domainId] = items;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des items:', err);
      }
    });
  }

  getProgresCategorie(categoryId: number): number {
    const domains = this.domains[categoryId] || [];
    if (domains.length === 0) return 0;
    const totalProgress = domains.reduce((sum, domain) => sum + (domain.acquis_percentage || 0), 0);
    return Math.round(totalProgress / domains.length);
  }

  calculerAge(birthDate: string): string {
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

  aDesDomainesEnCours(categoryId: number): boolean {
    return (this.domains[categoryId] || []).some(domain => (domain.acquis_percentage || 0) < 100);
  }

  getNombreDomainesEnCours(categoryId: number): number {
    return (this.domains[categoryId] || []).filter(domain => (domain.acquis_percentage || 0) < 100).length;
  }

  getDomainesEnCours(categoryId: number): ProfileDomain[] {
    return (this.domains[categoryId] || []).filter(domain => (domain.acquis_percentage || 0) < 100);
  }
}