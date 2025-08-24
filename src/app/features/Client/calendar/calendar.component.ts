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
import { ActivatedRoute, Router } from '@angular/router';
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
    locale: 'fr',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    initialView: 'dayGridMonth',
    buttonText: {
      today: 'Aujourd\'hui',
      month: 'Mois',
      week: 'Semaine',
      day: 'Jour',
      list: 'Liste'
    },
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
  showGoalDetailsModal = false;
  selectedGoalDate: string | null = null;
  selectedGoal: any = null;
  activeTab: 'details' | 'edit' = 'details';
  editingGoal: any = null;
  categories: ProfileCategory[] = [];
  domains: { [categoryId: number]: ProfileDomain[] } = {};
  goalRelatedDomains: ProfileDomain[] = [];
  private categoriesLoaded = false;
  private domainsLoadedCount = 0;
  private totalCategories = 0;

  get categoriesFiltrees(): ProfileCategory[] {
    return this.categories.filter(category => (this.domains[category.id!] || []).length > 0);
  }

  get listeDomainesEnCours(): ProfileDomain[] {
    // Return goal-related domains instead of all domains in progress
    return this.goalRelatedDomains;
  }

  items: { [domainId: number]: ProfileItem[] } = {};
  currentProfileId: number | null = null;
  currentLang: string = 'ar';
  currentLanguage: string = 'fr';
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
    private router: Router,
    private sharedService: SharedService,
    private translate: TranslateService
  ) {
    // Initialize current language
    this.currentLang = localStorage.getItem('lang') || 'ar';
    this.currentLanguage = localStorage.getItem('selectedLanguage') || 'fr';
    
    // Initialize translation service with current language
    this.translate.use(this.currentLang);
    
    // Initialize calendar options with current language
    this.calendarOptions.locale = this.currentLang;
    this.calendarOptions.buttonText = this.getButtonText(this.currentLang);
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
      
      // Add a timeout to ensure extraction runs after all data is loaded
      setTimeout(() => {
        if (this.goals && this.goals.length > 0) {
          console.log('Manual extraction trigger after timeout');
          this.extractGoalRelatedDomains(this.goals);
        }
      }, 2000);
    }

    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.currentLang = lang;
      this.currentLanguage = lang;
      this.translate.use(lang); // Tell the translation service to use the new language
      this.updateCalendarLanguage(lang);
    });

    // Initialize calendar with current language after translations are loaded
    this.translate.get('calendar.title').subscribe(() => {
      this.updateCalendarLanguage(this.currentLang);
    });

    // Make debug methods available globally for testing
    (window as any).calendarDebug = {
      extractDomains: () => this.manualExtractGoalDomains(),
      debugState: () => this.debugCurrentState()
    };
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
    // Return French or Arabic button texts based on language
    if (language === 'ar') {
      return {
        today: 'اليوم',
        month: 'شهر',
        week: 'أسبوع',
        day: 'يوم',
        list: 'قائمة'
      };
    } else {
      // Default to French
      return {
        today: 'Aujourd\'hui',
        month: 'Mois',
        week: 'Semaine',
        day: 'Jour',
        list: 'Liste'
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
        // Only extract goal-related domains if categories and domains are loaded
        if (this.categoriesLoaded && this.domainsLoadedCount === this.totalCategories) {
          this.extractGoalRelatedDomains(goals);
        }
        this.mettreAJourEvenementsCalendrier(); 
      },
      error: (error: any) => {
        try {
          console.error(this.translate.instant('calendar.errors.load_goals'), error);
          Swal.fire(
            this.translate.instant('calendar.messages.error'),
            this.translate.instant('calendar.messages.load_goals_error'),
            'error'
          );
        } catch (translationError) {
          console.error('Erreur lors du chargement des objectifs:', error);
          Swal.fire('Erreur', 'Impossible de charger les objectifs.', 'error');
        }
      }
    });
  }

  extractGoalRelatedDomains(goals: any[]): void {
    this.goalRelatedDomains = [];
    
    if (!goals || goals.length === 0) {
      console.log('No goals found, returning empty goalRelatedDomains');
      return;
    }

    console.log('Extracting goal-related domains from goals:', goals);
    console.log('Available categories:', this.categories);
    console.log('Available domains:', this.domains);

    // First, try to find domains in the loaded categories/domains
    const domainIds = new Set<number>();
    goals.forEach(goal => {
      if (goal.domain_id) {
        // Handle case where domain_id is directly on the goal
        const domainId = Number(goal.domain_id);
        domainIds.add(domainId);
        console.log('Found domain_id directly on goal:', goal.domain_id, 'converted to:', domainId);
      } else if (goal.domain && goal.domain.id) {
        // Handle case where domain is nested object (as shown in API response)
        const domainId = Number(goal.domain.id);
        domainIds.add(domainId);
        console.log('Found nested domain.id:', goal.domain.id, 'converted to:', domainId);
      } else {
        console.log('No domain information found in goal:', goal);
      }
    });

    console.log('Extracted domain IDs:', Array.from(domainIds));

    // Find domains that are related to goals
    domainIds.forEach(domainId => {
      console.log(`Looking for domain ID: ${domainId} (type: ${typeof domainId})`);
      // Search through all categories and domains to find the matching domain
      for (const category of this.categories) {
        const categoryDomains = this.domains[category.id!] || [];
        console.log(`Searching in category ${category.id} (${category.name}):`, categoryDomains);
        
        // Check each domain in this category
        categoryDomains.forEach(domain => {
          console.log(`  Checking domain ${domain.id} (type: ${typeof domain.id}) against ${domainId} (type: ${typeof domainId})`);
          if (Number(domain.id) === domainId) {
            console.log('  MATCH FOUND!');
          }
        });
        
        const domain = categoryDomains.find(d => Number(d.id) === domainId);
        if (domain) {
          this.goalRelatedDomains.push(domain);
          console.log('Found matching domain:', domain);
          break;
        }
      }
    });

    // If no domains found in loaded data, try to extract from goals directly
    if (this.goalRelatedDomains.length === 0) {
      console.log('No domains found in loaded data, trying to extract from goals directly...');
      goals.forEach(goal => {
        if (goal.domain && goal.domain.id) {
          // Create a domain object from the goal's domain data
          const domainData: any = {
            id: Number(goal.domain.id),
            name: goal.domain.name || 'Unknown Domain',
            description: goal.domain.description || '',
            acquis_percentage: goal.domain.acquis_percentage || 0,
            start_date: this.formatDate(goal.domain.start_date),
            last_eval_date: this.formatDate(goal.domain.last_evaluation_date),
            progress: goal.domain.acquis_percentage || 0
          };
          
          console.log('Created domain data with dates:', {
            start_date: domainData.start_date,
            last_eval_date: domainData.last_eval_date,
            start_date_type: typeof domainData.start_date,
            last_eval_date_type: typeof domainData.last_eval_date
          });
          
          // Check if this domain is already in the array
          const existingDomain = this.goalRelatedDomains.find(d => d.id === domainData.id);
          if (!existingDomain) {
            this.goalRelatedDomains.push(domainData);
            console.log('Added domain from goal data:', domainData);
          }
        }
      });
    }

    console.log('Final goalRelatedDomains:', this.goalRelatedDomains);
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
        console.error(this.translate.instant('calendar.errors.load_events'), error);
      }
    });
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    this.selectedGoalDate = selectInfo.startStr;
    this.showGoalFormModal = true;
    selectInfo.view.calendar.unselect();
  }

  handleEventClick(clickInfo: EventClickArg) {
    // Find the goal data from the goals array
    const goalId = parseInt(clickInfo.event.id);
    this.selectedGoal = this.goals.find(goal => goal.id === goalId);
    
    if (this.selectedGoal) {
      this.showGoalDetailsModal = true;
    } else {
      console.error('Goal not found:', goalId);
    }
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
      title: this.translate.instant('calendar.messages.saved'),
      text: this.translate.instant('calendar.messages.goal_added_success', { title: goal.title }),
      timer: 2000,
      showConfirmButton: false
    });
  }

  chargerCategories(profileId: number) {
    this.categoryService.getCategories(profileId).subscribe({
      next: (categories) => {
        this.categories = categories;
        this.categoriesLoaded = true;
        this.totalCategories = categories.length;
        this.domainsLoadedCount = 0;
        
        categories.forEach((category) => {
          this.chargerDomaines(category.id!);
        });
      },
      error: (err) => {
        console.error(this.translate.instant('calendar.errors.load_categories'), err);
      }
    });
  }

  chargerDomaines(categoryId: number) {
    console.log(`Loading domains for category ${categoryId}...`);
    // Try using getDomains instead of getDomainsWithSpecificItems to get all domains
    this.domainService.getDomains(categoryId).subscribe({
      next: (domains) => {
        console.log(`Received ${domains.length} domains for category ${categoryId}:`, domains);
        this.domains[categoryId] = domains.map((domain) => ({
          ...domain,
          progress: domain.acquis_percentage || 0,
          start_date: this.formatDate(domain.start_date),
          last_eval_date: this.formatDate(domain.last_eval_date)
        }));
        
        this.domainsLoadedCount++;
        console.log(`Domains loaded count: ${this.domainsLoadedCount}/${this.totalCategories}`);
        
        // Re-extract goal-related domains when all domains are loaded and goals exist
        if (this.domainsLoadedCount === this.totalCategories && this.goals && this.goals.length > 0) {
          console.log('All domains loaded, re-extracting goal-related domains');
          this.extractGoalRelatedDomains(this.goals);
        }
      },
      error: (err) => {
        console.error(`Error loading domains for category ${categoryId}:`, err);
        console.error(this.translate.instant('calendar.errors.load_domains'), err);
        // Still increment count to avoid blocking
        this.domainsLoadedCount++;
      }
    });
  }

  chargerItems(domainId: number) {
    this.itemService.getItems(domainId).subscribe({
      next: (items) => {
        this.items[domainId] = items;
      },
      error: (err) => {
        console.error(this.translate.instant('calendar.errors.load_items'), err);
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

  getOverallProgress(): number {
    if (this.goalRelatedDomains.length === 0) return 0;
    const totalProgress = this.goalRelatedDomains.reduce((sum, domain) => sum + (domain.acquis_percentage || 0), 0);
    return Math.round(totalProgress / this.goalRelatedDomains.length);
  }

  getProgressClass(percentage: number): string {
    if (percentage >= 80) return 'progress-excellent';
    if (percentage >= 60) return 'progress-good';
    if (percentage >= 40) return 'progress-average';
    return 'progress-poor';
  }

  getProgressIcon(percentage: number): string {
    if (percentage >= 80) return 'bx-trophy';
    if (percentage >= 60) return 'bx-check-circle';
    if (percentage >= 40) return 'bx-time';
    return 'bx-error-circle';
  }

  // Method to manually trigger extraction for debugging
  manualExtractGoalDomains(): void {
    console.log('Manual extraction triggered');
    if (this.goals && this.goals.length > 0) {
      this.extractGoalRelatedDomains(this.goals);
    } else {
      console.log('No goals available for extraction');
    }
  }

  // Debug method to check current state
  debugCurrentState(): void {
    console.log('=== DEBUG CURRENT STATE ===');
    console.log('Goals:', this.goals);
    console.log('Categories:', this.categories);
    console.log('Domains:', this.domains);
    console.log('Goal Related Domains:', this.goalRelatedDomains);
    console.log('Categories Loaded:', this.categoriesLoaded);
    console.log('Domains Loaded Count:', this.domainsLoadedCount);
    console.log('Total Categories:', this.totalCategories);
    console.log('==========================');
  }

  // Navigate to quiz for a specific domain
  navigateToQuiz(domain: any): void {
    if (domain.id) {
      console.log('Navigating to quiz for domain:', domain);
      // Use the same navigation pattern as the goals component
      this.router.navigate(['/Dashboard-client/client/quiz', domain.id]);
    } else {
      console.error('Cannot navigate to quiz: missing domainId');
      Swal.fire({
        icon: 'error',
        title: this.translate.instant('calendar.messages.error'),
        text: this.translate.instant('calendar.messages.navigation_error')
      });
    }
  }

  // Save edited goal
  saveEditedGoal(): void {
    if (this.editingGoal && this.editingGoal.id) {
      // Validate required fields
      if (!this.editingGoal.title || !this.editingGoal.target_date) {
        Swal.fire({
          icon: 'error',
          title: this.translate.instant('calendar.messages.error'),
          text: this.translate.instant('calendar.goal.validation.title_required')
        });
        return;
      }

      // Add profile_id to the editing goal data
      const goalDataToUpdate = {
        ...this.editingGoal,
        profile_id: this.currentProfileId
      };

      this.goalService.updateGoal(this.editingGoal.id, goalDataToUpdate).subscribe({
        next: (updatedGoal) => {
          // Update the selected goal with the new data
          this.selectedGoal = updatedGoal;
          // Update the goal in the goals array
          const index = this.goals.findIndex(g => g.id === updatedGoal.id);
          if (index !== -1) {
            this.goals[index] = updatedGoal;
          }
          // Update calendar events
          this.mettreAJourEvenementsCalendrier();
          
          Swal.fire({
            icon: 'success',
            title: this.translate.instant('calendar.messages.saved'),
            text: this.translate.instant('calendar.goal.update_success'),
            timer: 2000,
            showConfirmButton: false
          });
          
          // Switch back to details tab
          this.activeTab = 'details';
        },
        error: (error) => {
          console.error('Error updating goal:', error);
          Swal.fire({
            icon: 'error',
            title: this.translate.instant('calendar.messages.error'),
            text: this.translate.instant('calendar.goal.update_error')
          });
        }
      });
    }
  }

  // Cancel editing
  cancelEditing(): void {
    this.editingGoal = null;
    this.activeTab = 'details';
  }

  // Handle goal delete
  onDeleteGoal(): void {
    if (this.selectedGoal) {
      Swal.fire({
        title: this.translate.instant('calendar.messages.warning'),
        text: this.translate.instant('calendar.messages.delete_goal_confirm', { title: this.selectedGoal.title }),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: this.translate.instant('calendar.messages.yes_delete'),
        cancelButtonText: this.translate.instant('calendar.messages.cancel')
      }).then((result) => {
        if (result.isConfirmed) {
          const goalId = this.selectedGoal.id;
          this.goalService.deleteGoal(goalId).subscribe({ 
            next: () => {
              this.showGoalDetailsModal = false;
              this.selectedGoal = null;
              Swal.fire(
                this.translate.instant('calendar.messages.deleted'),
                this.translate.instant('calendar.messages.delete_goal_success'),
                'success'
              );
              if (this.currentProfileId) {
                this.chargerObjectifs(this.currentProfileId); 
              }
            },
            error: (error: any) => {
              console.error(this.translate.instant('calendar.errors.delete_goal'), error);
              Swal.fire(
                this.translate.instant('calendar.messages.error'),
                this.translate.instant('calendar.messages.delete_goal_error'),
                'error'
              );
            }
          });
        }
      });
    }
  }

  // Close goal details modal
  closeGoalDetailsModal(): void {
    this.showGoalDetailsModal = false;
    this.selectedGoal = null;
    this.editingGoal = null;
    this.activeTab = 'details';
  }

  // Switch to edit tab
  switchToEditTab(): void {
    this.activeTab = 'edit';
    // Create a copy of the selected goal for editing
    this.editingGoal = { 
      ...this.selectedGoal,
      profile_id: this.currentProfileId // Ensure profile_id is included
    };
  }

  // Switch to details tab
  switchToDetailsTab(): void {
    this.activeTab = 'details';
  }

  // Format date for display
  formatGoalDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  // Get priority translation
  getPriorityTranslation(priority: string): string {
    return this.translate.instant(`calendar.goal.priority.${priority}`);
  }

  // Calculate goal progress
  calculateGoalProgress(goal: any): number {
    if (!goal || !goal.sub_objectives || goal.sub_objectives.length === 0) {
      return 0;
    }

    const totalSubObjectives = goal.sub_objectives.length;
    const completedSubObjectives = goal.sub_objectives.filter((sub: any) => sub.is_completed).length;

    return Math.round((completedSubObjectives / totalSubObjectives) * 100);
  }

  // Helper method to format dates properly
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return new Date().toISOString().split('T')[0];
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return new Date().toISOString().split('T')[0];
    }
  }

  // Helper method to format date with label
  formatDateWithLabel(dateString: string | null | undefined, labelKey: string): string {
    const formattedDate = this.formatDate(dateString);
    const dateObj = new Date(formattedDate);
    const shortDate = dateObj.toLocaleDateString();
    
    if (this.currentLang === 'ar') {
      return `${this.translate.instant(labelKey)}: ${shortDate}`;
    } else {
      return `${this.translate.instant(labelKey)}: ${shortDate}`;
    }
  }

  // Helper method to get the appropriate field for ProfileCategory based on language
  getCategoryLanguageField(category: ProfileCategory, fieldName: string): string {
    if (this.currentLanguage === 'ar') {
      // For Arabic language, use _ar fields
      if (fieldName === 'name') {
        return category.name_ar || '';
      } else if (fieldName === 'description') {
        return category.description_ar || '';
      }
    } else {
      // For French language, use non-_ar fields
      if (fieldName === 'name') {
        return category.name || '';
      } else if (fieldName === 'description') {
        return category.description || '';
      }
    }
    return '';
  }

  // Helper method to get the appropriate field for ProfileDomain based on language
  getDomainLanguageField(domain: ProfileDomain, fieldName: string): string {
    if (this.currentLanguage === 'ar') {
      // For Arabic language, use _ar fields
      if (fieldName === 'name') {
        return domain.name_ar || '';
      } else if (fieldName === 'description') {
        return domain.description_ar || '';
      }
    } else {
      // For French language, use non-_ar fields
      if (fieldName === 'name') {
        return domain.name || '';
      } else if (fieldName === 'description') {
        return domain.description || '';
      }
    }
    return '';
  }

  // Helper method to get the appropriate field for ProfileItem based on language
  getItemLanguageField(item: ProfileItem, fieldName: string): string {
    if (this.currentLanguage === 'ar') {
      // For Arabic language, use _ar fields
      if (fieldName === 'name') {
        return item.name_ar || '';
      } else if (fieldName === 'description') {
        return item.description_ar || '';
      } else if (fieldName === 'comentaire') {
        return item.commentaire_ar || '';
      }
    } else {
      // For French language, use non-_ar fields
      if (fieldName === 'name') {
        return item.name || '';
      } else if (fieldName === 'description') {
        return item.description || '';
      } else if (fieldName === 'comentaire') {
        return item.comentaire || '';
      }
    }
    return '';
  }

  // Helper method to get category display name
  getCategoryDisplayName(category: ProfileCategory): string {
    return this.getCategoryLanguageField(category, 'name') || category.name || '';
  }

  // Helper method to get domain display name
  getDomainDisplayName(domain: ProfileDomain): string {
    return this.getDomainLanguageField(domain, 'name') || domain.name || '';
  }

  // Helper method to get item display name
  getItemDisplayName(item: ProfileItem): string {
    return this.getItemLanguageField(item, 'name') || item.name || '';
  }
}