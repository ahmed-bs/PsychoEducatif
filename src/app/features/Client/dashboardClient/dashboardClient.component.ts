import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ShareProfileRequest } from 'src/app/core/models/createprofile.model';
import { Profile } from 'src/app/core/models/profile.model';
import { ProfileService } from 'src/app/core/services/profile.service';
import Swal from 'sweetalert2';
import { ProfileCategory } from 'src/app/core/models/ProfileCategory';
import { ProfileDomain } from 'src/app/core/models/ProfileDomain';
import { ProfileDomainService } from 'src/app/core/services/ProfileDomain.service';
import { ProfileCategoryService } from 'src/app/core/services/ProfileCategory.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js';
import { GoalsComponent } from "./tabs/goals/goals.component";
import { AddGoalModalComponent } from "./modals/add-goal-modal/add-goal-modal.component";
import { GoalService } from 'src/app/core/services/goal.service';
import { AuthService } from 'src/app/core/services/authService.service';
import { NotesComponent } from "./tabs/notes/notes.component";
import { StrategyComponent } from './tabs/strategy/strategy.component';
import { environment } from 'src/environments/environment';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { StatisticsService, OverallStatistics, CategoryStatistics } from 'src/app/core/services/statistics.service';
import { Subscription } from 'rxjs';
import { ProfileItem } from 'src/app/core/models/ProfileItem';

@Component({
  selector: 'app-dashboardClient',
  templateUrl: './dashboardClient.component.html',
  styleUrls: ['./dashboardClient.component.css'],
  standalone: true,
  imports: [ButtonModule, DialogModule,TranslateModule, InputTextModule, FormsModule, CommonModule, DropdownModule, NgChartsModule, GoalsComponent, AddGoalModalComponent, NotesComponent, StrategyComponent],
  providers: [MessageService]
})

export class DashboardClientComponent implements OnInit, OnDestroy {
  children: Profile[] = [];
  filteredChildren: Profile[] = [];
  searchTerm: string = '';
  selectedChild: Profile | null = null;
  childId: string | null = null;
  parentId!: number;
  categories: ProfileCategory[] = [];
  domains: { [categoryId: number]: ProfileDomain[] } = {};
  displayDialog: boolean = false;
  displayEditDialog: boolean = false;
  afficherBoiteDialoguePartage: boolean = false;
  selectedFile: File | null = null;

  newChild: Profile = this.resetChild();

  saisieEmail: string = '';

  accesSelectionne: any;

  optionsAcces: any[] = [
    { libelle: 'Lecture seule', valeur: 'read_only' },
    { libelle: 'Lecture et modification', valeur: 'read_write' }
  ];

  sharePermissions: any = {
    can_read: true,
    can_write: false,
    can_update: false,
    can_delete: false
  };

  activeTab: string = 'stats';
  
  showGoalFormModal = false;

  tabs = [
    { id: 'skills', label: 'dashboard.tabs.skills' },
    { id: 'goals', label: 'dashboard.tabs.goals' },
    { id: 'strategies', label: 'dashboard.tabs.strategies' },
    { id: 'notes', label: 'dashboard.tabs.notes' },
    { id: 'stats', label: 'dashboard.tabs.stats' }
  ];

  progressBars = [
    { id: 'progress1', width: '75%' },
    { id: 'progress2', width: '50%' },
    { id: 'progress3', width: '90%' }
  ];

  // Chart data for skills per domain (doughnut)
  skillsChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
          '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
        ],
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverBorderWidth: 5,
        hoverBorderColor: '#ffffff',
      },
    ],
  };
  skillsChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { 
          color: '#374151', 
          font: { size: 12, weight: '500' },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        },
      },
      title: {
        display: true,
        text: 'Répartition des Compétences',
        color: '#1F2937',
        font: { size: 16, weight: 'bold' },
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#ffffff',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} ${this.getTranslatedChartLabel('competencies')} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
    radius: '90%'
  };

  // Chart data for progress comparison (bar chart)
  progressChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: '',
        data: [],
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: '',
        data: [],
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ],
  };
  progressChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { 
          color: '#374151', 
          font: { size: 12, weight: '500' },
          usePointStyle: true,
          pointStyle: 'rect'
        },
      },
      title: {
        display: true,
        text: 'Progrès par Domaine',
        color: '#1F2937',
        font: { size: 16, weight: 'bold' },
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#ffffff',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      x: { 
        ticks: { color: '#6B7280', font: { size: 11 } },
        grid: { color: 'rgba(107, 114, 128, 0.1)' }
      },
      y: { 
        ticks: { color: '#6B7280', font: { size: 11 } },
        grid: { color: 'rgba(107, 114, 128, 0.1)' },
        beginAtZero: true, 
        max: 100 
      },
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  // Chart data for skill assessment (line chart replacing radar)
  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        label: '',
        data: [],
        fill: false,
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        tension: 0.4,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      }
    ],
  };
  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { 
          color: '#374151', 
          font: { size: 12, weight: '500' }
        },
      },
      title: {
        display: true,
        text: 'Évaluation des Compétences',
        color: '#1F2937',
        font: { size: 16, weight: 'bold' },
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#ffffff',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#6B7280', font: { size: 11 } },
        grid: { color: 'rgba(107, 114, 128, 0.1)' }
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { color: '#6B7280', font: { size: 11 } },
        grid: { color: 'rgba(107, 114, 128, 0.1)' }
      }
    }
  };

  // Chart data for domain overview (polar area chart)
  polarChartData: ChartConfiguration<'polarArea'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          'rgba(255, 107, 107, 0.7)',
          'rgba(78, 205, 196, 0.7)',
          'rgba(69, 183, 209, 0.7)',
          'rgba(150, 206, 180, 0.7)',
          'rgba(255, 234, 167, 0.7)',
          'rgba(221, 160, 221, 0.7)',
          'rgba(152, 216, 200, 0.7)',
          'rgba(247, 220, 111, 0.7)'
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };
  polarChartOptions: ChartConfiguration<'polarArea'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { 
          color: '#374151', 
          font: { size: 11, weight: '500' },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        },
      },
      title: {
        display: true,
        text: 'Vue d\'Ensemble des Domaines',
        color: '#1F2937',
        font: { size: 16, weight: 'bold' },
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#ffffff',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed.r;
            return `${label}: ${value} ${this.getTranslatedChartLabel('competencies')}`;
          }
        }
      }
    },
    scales: {
      r: {
        ticks: {
          color: '#6B7280',
          font: { size: 10 },
          stepSize: 1
        },
        grid: {
          color: 'rgba(107, 114, 128, 0.1)'
        }
      }
    }
  };

  goals: any[] = [];

  goalToEdit: any | null = null;

  currentProfileIdForModal: number | null = null;

  isEmailValid: boolean = false;
  loadingShare: boolean = false;
  currentLanguage: string = 'fr';
  private languageSubscription: Subscription;
  
  // Statistics data
  statistics: OverallStatistics | null = null;
  isLoadingStatistics: boolean = false;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private messageService: MessageService,
    private categoryService: ProfileCategoryService, 
    private domainService: ProfileDomainService,
    private goalService: GoalService, 
    private authService: AuthService,    private translate: TranslateService,
    private sharedService: SharedService,
    private statisticsService: StatisticsService,
    private cdr: ChangeDetectorRef
  ) {
    this.accesSelectionne = this.optionsAcces[0];
    
    // Initialize current language and set default
    const savedLang = localStorage.getItem('lang') || localStorage.getItem('selectedLanguage') || 'fr';
    this.translate.setDefaultLang('fr');
    this.translate.use(savedLang);
    this.currentLanguage = savedLang;
    
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
      this.currentLanguage = lang;
      // Update charts with new language
      if (this.statistics) {
        this.updateSkillsChart();
      }
      // Force refresh statistics display
      this.refreshStatisticsDisplay();
      // Reload categories if they're not available but statistics are
      if (this.statistics && this.categories.length === 0 && this.selectedChild?.id) {
        this.loadCategories(this.selectedChild.id);
      }
      // Force change detection to update translations
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  ngOnInit() {
    // Initialize translation
    const savedLang = localStorage.getItem('lang') || localStorage.getItem('selectedLanguage') || 'fr';
    this.translate.use(savedLang);
    this.currentLanguage = savedLang;
    
    const user = localStorage.getItem('user');
    this.parentId = user ? Number(JSON.parse(user).id) : 0;

    this.childId = this.route.snapshot.paramMap.get('childId');

    if (this.childId) {
      this.loadChild(parseInt(this.childId));
      this.currentProfileIdForModal = parseInt(this.childId);
    } else {
      this.currentProfileIdForModal = this.parentId;
    }

    // Check for tab query parameter to set active tab
    this.route.queryParams.subscribe(params => {
      if (params['tab'] && this.tabs.some(tab => tab.id === params['tab'])) {
        this.activeTab = params['tab'];
        // Load statistics if stats tab is selected
        if (this.activeTab === 'stats' && this.selectedChild?.id && !this.statistics) {
          this.loadStatistics(this.selectedChild.id);
        }
      }
    });

    this.loadChildren();
    this.loadGoals();

    setTimeout(() => {
      this.progressBars.forEach(bar => {
        const currentWidth = bar.width;
        bar.width = '0%';
        setTimeout(() => {
          bar.width = currentWidth;
        }, 100);
      });
    }, 300);
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  loadGoals(): void {
    if (this.currentProfileIdForModal) {
      this.goalService.getGoalsByProfile(this.currentProfileIdForModal).subscribe({
        next: (data) => {
          this.goals = data;
        },
        error: (error) => {
          console.error('Error loading goals:', error);
          if (error.status === 401) {
            console.error('Unauthorized: Could not load goals. Please log in again.');
          }
        }
      });
    } else {
      console.warn('User not logged in. Cannot load goals.');
    }
  }

  openAddGoalModal(): void {
    this.goalToEdit = null;
    this.showGoalFormModal = true;
  }

  openEditGoalModal(goal: any): void {
    this.goalToEdit = { ...goal };
    this.showGoalFormModal = true;
  }

  closeGoalFormModal(): void {
    this.showGoalFormModal = false;
    this.goalToEdit = null;
  }

  onGoalSaved(savedGoal: any): void {
    console.log('Goal saved (new or updated) received by DashboardClientComponent:', savedGoal);

    const index = this.goals.findIndex(g => g.id === savedGoal.id);

    if (index !== -1) {
      this.goals[index] = savedGoal;
    } else {
      this.goals.push(savedGoal);
    }
    this.closeGoalFormModal();
  }

  onToggleSubObjective({ goalId, subObjectiveId, newStatus }: { goalId: number; subObjectiveId: number; newStatus: boolean }): void {
    const goalIndex = this.goals.findIndex(g => g.id === goalId);

    if (goalIndex !== -1) {
      const goalToUpdate = { ...this.goals[goalIndex] };

      const subObjectiveIndex = goalToUpdate.sub_objectives.findIndex((sub: any) => sub.id === subObjectiveId);

      if (subObjectiveIndex !== -1) {
        goalToUpdate.sub_objectives[subObjectiveIndex] = {
          ...goalToUpdate.sub_objectives[subObjectiveIndex],
          is_completed: newStatus
        };

        this.goals[goalIndex] = goalToUpdate;

        this.goalService.updateGoal(goalToUpdate.id, goalToUpdate).subscribe({
          next: (response) => {
            console.log('Sub-objective status updated successfully on backend:', response);
          },
          error: (error) => {
            console.error('Error updating sub-objective status:', error);
            this.loadGoals();
            console.error('Failed to update sub-objective. Please try again.');
          }
        });
      } else {
        console.warn(`Sub-objective with ID ${subObjectiveId} not found in goal ${goalId}.`);
      }
    } else {
      console.warn(`Goal with ID ${goalId} not found.`);
    }
  }
  
  onDeleteGoal(goalId: number): void {
    this.goalService.deleteGoal(goalId).subscribe({
      next: () => {
        console.log(`Goal with ID ${goalId} deleted successfully.`);
        this.goals = this.goals.filter(goal => goal.id !== goalId);
      },
      error: (error) => {
        console.error(`Error deleting goal with ID ${goalId}:`, error);
      }
    });
  }

  get filteredCategories(): ProfileCategory[] {
    return this.categories.filter(category => (this.domains[category.id!] || []).length > 0);
  }

  loadCategories(profileId: number) {
    this.categoryService.getCategories(profileId).subscribe({
      next: (categories) => {
        this.categories = categories;
        // Load domains for each category
        categories.forEach((category) => {
          this.loadDomains(category.id!);
        });
        // Update chart data for skills
        this.updateSkillsChart();
        // Refresh statistics display if statistics are already loaded
        if (this.statistics) {
          this.updateSkillsChart();
        }
      },
      error: (err) => {
        Swal.fire('Erreur', 'Impossible de charger les catégories.', 'error');
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
        this.updateSkillsChart();
      },
      error: (err) => {
        Swal.fire('Erreur', 'Impossible de charger les domaines.', 'error');
      }
    });
  }

  formatDate(dateString: string | undefined | null): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch (e) {
      console.error("Invalid date string for formatting:", dateString, e);
      return dateString;
    }
  }

  formatNumber(value: number | undefined | null): string {
    if (value === undefined || value === null) return '0';
    return value.toFixed(2);
  }

  getTabIcon(tabId: string): string {
    const iconMap: { [key: string]: string } = {
      'skills': 'fas fa-star',
      'goals': 'fas fa-bullseye',
      'strategies': 'fas fa-lightbulb',
      'notes': 'fas fa-sticky-note',
      'stats': 'fas fa-chart-bar'
    };
    return iconMap[tabId] || 'fas fa-circle';
  }

  switchTab(tabId: string): void {
    this.activeTab = tabId;
    
    // Load statistics when stats tab is accessed
    if (tabId === 'stats' && this.selectedChild?.id && !this.statistics) {
      this.loadStatistics(this.selectedChild.id);
    }
  }

  isTabActive(tabId: string): boolean {
    return this.activeTab === tabId;
  }

  getNoCompetenciesTitle(): string {
    const key = 'dashboard.skills_content.no_competencies.title';
    try {
      const translation = this.translate.instant(key);
      // If translation returns the key itself, it means translation wasn't found
      if (translation && translation !== key) {
        return translation;
      }
    } catch (e) {
      console.warn('Translation error for no_competencies.title:', e);
    }
    return 'No Competencies Found';
  }

  getNoCompetenciesMessage(): string {
    const key = 'dashboard.skills_content.no_competencies.message';
    try {
      const translation = this.translate.instant(key);
      // If translation returns the key itself, it means translation wasn't found
      if (translation && translation !== key) {
        return translation;
      }
    } catch (e) {
      console.warn('Translation error for no_competencies.message:', e);
    }
    return 'This profile hasn\'t been evaluated even once. Please start an evaluation to see competencies here.';
  }

  loadChildren() {
    this.profileService.getProfilesByParent(this.parentId).subscribe({
      next: (children) => {
        this.children = children.map(child => {
          let imageUrl = (child as any).image || child.image_url;
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `${environment.apiUrl.slice(0, -1)}${imageUrl}`;
          }
          return {
            ...child,
            image_url: imageUrl
          };
        });
        this.filteredChildren = [...this.children];
        if (this.childId) {
          this.selectedChild = this.children.find(child => child.id === parseInt(this.childId!, 10)) || null;
        }
      },
      error: (err) => {
        Swal.fire('Erreur', 'Impossible de charger les profils.', 'error');
      }
    });
  }

  loadparmail(childId: number) {
    this.profileService.getProfileById(childId).subscribe({
      next: (child) => {
        let imageUrl = (child as any).image || child.image_url;
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `${environment.apiUrl.slice(0, -1)}${imageUrl}`;
        }
        this.selectedChild = {
          ...child,
          image_url: imageUrl
        };
      },
      error: (err) => {
        Swal.fire('Erreur', 'Impossible de charger le profil.', 'error');
      }
    });
  }

  loadChild(childId: number) {
    this.profileService.getProfileById(childId).subscribe({
      next: (child) => {
        let imageUrl = (child as any).image || child.image_url;
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `${environment.apiUrl.slice(0, -1)}${imageUrl}`;
        }
        this.selectedChild = {
          ...child,
          image_url: imageUrl
        };
        this.loadCategories(childId);
        this.currentProfileIdForModal = childId;
        this.loadGoals();
        
        // Check for tab query parameter after child is loaded
        const tabParam = this.route.snapshot.queryParams['tab'];
        if (tabParam && this.tabs.some(tab => tab.id === tabParam)) {
          this.activeTab = tabParam;
          // Load statistics if stats tab is selected
          if (this.activeTab === 'stats' && child.id && !this.statistics) {
            this.loadStatistics(child.id);
          }
        } else {
          // Default: load statistics if no specific tab
          this.loadStatistics(childId);
        }
      },
      error: (err) => {
        Swal.fire('Erreur', 'Impossible de charger le profil.', 'error');
      }
    });
  }

  selectChild(child: Profile) {
    this.selectedChild = child;
    if (child.id) {
      this.loadCategories(child.id);
      this.currentProfileIdForModal = child.id;
      this.loadGoals();
      this.loadStatistics(child.id);
    }
  }

  filterChildren() {
    if (!this.searchTerm) {
      this.filteredChildren = [...this.children];
    } else {
      this.filteredChildren = this.children.filter(child =>
        `${child.first_name} ${child.last_name}`.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  showDialog() {
    this.newChild = this.resetChild();
    this.displayDialog = true;
  }

  showEditDialog() {
    if (this.selectedChild) {
      this.newChild = { ...this.selectedChild };
      this.displayEditDialog = true;
    }
  }

  showShareDialog() {
    this.saisieEmail = '';
    this.sharePermissions = { can_read: true, can_write: false, can_update: false, can_delete: false };
    this.accesSelectionne = this.optionsAcces[0];
    this.afficherBoiteDialoguePartage = true;
  }

  addChild() {
    if (this.newChild.first_name && this.newChild.last_name && this.newChild.birth_date) {
      const formData = new FormData();
      formData.append('first_name', this.newChild.first_name);
      formData.append('last_name', this.newChild.last_name);
      formData.append('birth_date', this.newChild.birth_date);
      formData.append('gender', this.newChild.gender || 'M');
      formData.append('diagnosis', this.newChild.diagnosis || '');
      formData.append('notes', this.newChild.notes || '');
      if (this.selectedFile) {
        formData.append('image', this.selectedFile, this.selectedFile.name);
      }
      this.profileService.createChildProfile(formData).subscribe({
        next: (child) => {
          let imageUrl = (child as any).image || child.image_url;
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `${environment.apiUrl.slice(0, -1)}${imageUrl}`;
          }
          this.children.push({
            ...child,
            image_url: imageUrl
          });
          this.filteredChildren = [...this.children];
          this.displayDialog = false;
          Swal.fire('Succès', 'Profil ajouté avec succès.', 'success');
        },
        error: (err) => {
          Swal.fire('Erreur', 'Impossible d\'ajouter le profil.', 'error');
        }
      });
    } else {
      Swal.fire('Erreur', 'Veuillez remplir tous les champs obligatoires.', 'warning');
    }
  }

  saveChild() {
    if (this.selectedChild && this.selectedChild.id) {
      const formData = new FormData();
      formData.append('first_name', this.selectedChild.first_name);
      formData.append('last_name', this.selectedChild.last_name);
      formData.append('birth_date', this.selectedChild.birth_date);
      formData.append('gender', this.selectedChild.gender || 'M');
      formData.append('diagnosis', this.selectedChild.diagnosis || '');
      formData.append('notes', this.selectedChild.notes || '');
      if (this.selectedFile) {
        formData.append('image', this.selectedFile, this.selectedFile.name);
      }
      this.profileService.updateChildProfile(this.selectedChild.id, formData).subscribe({
        next: (updatedChild) => {
          let imageUrl = (updatedChild as any).image || updatedChild.image_url;
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `${environment.apiUrl.slice(0, -1)}${imageUrl}`;
          }
          
          // Update selectedChild with the new image URL
          this.selectedChild = {
            ...updatedChild,
            image_url: imageUrl
          };
          
          const index = this.children.findIndex(c => c.id === updatedChild.id);
          if (index !== -1) {
            this.children[index] = {
              ...updatedChild,
              image_url: imageUrl
            };
            this.filteredChildren = [...this.children];
          }
          this.displayEditDialog = false;
          Swal.fire('Succès', 'Profil mis à jour avec succès.', 'success');
        },
        error: (err) => {
          Swal.fire('Erreur', 'Impossible de mettre à jour le profil.', 'error');
        }
      });
    }
  }

  disableChild(child: Profile) {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: `Voulez-vous vraiment désactiver ${child.first_name} ${child.last_name} ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, désactiver',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.profileService.deleteChildProfile(child.id!).subscribe({
          next: () => {
            this.children = this.children.filter(c => c.id !== child.id);
            this.filteredChildren = [...this.children];
            if (this.selectedChild?.id === child.id) {
              this.selectedChild = null;
            }
            Swal.fire('Désactivé', `${child.first_name} ${child.last_name} a été désactivé.`, 'success');
          },
          error: (err) => {
            Swal.fire('Erreur', 'Impossible de désactiver le profil.', 'error');
          }
        });
      }
    });
  }

  validateEmail() {
    // Simple email regex
    this.isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.saisieEmail);
  }
  setDefaultImage(event: any, child: Profile) {
    let defaultImg = '';
    if (child.gender === 'F') {
        if (child.category === 'Toddler') defaultImg = '/assets/image_client/image copy 2.png';
        else if (child.category === 'Young Child') defaultImg = '/assets/image_client/image copy 6.png';
        else if (child.category === 'Young Adult') defaultImg = '/assets/image_client/image copy 8.png';
    } else {
        if (child.category === 'Toddler') defaultImg = '/assets/image_client/image copy 3.png';
        else if (child.category === 'Young Child') defaultImg = '/assets/image_client/image copy 5.png';
        else if (child.category === 'Young Adult') defaultImg = '/assets/image_client/image copy 7.png';
    }
    event.target.src = defaultImg || '/assets/image_client/image copy 2.png';
}
  shareProfile() {
    if (!this.selectedChild || !this.saisieEmail) {
      Swal.fire('Erreur', 'Veuillez sélectionner un profil et entrer un email.', 'warning');
      return;
    }

    this.loadingShare = true;

    const permissions: ('view' | 'edit' | 'share')[] = ['view'];
    if (this.accesSelectionne.valeur === 'read_write') {
      permissions.push('edit');
    }

    const shareData: ShareProfileRequest = {
      shared_with: this.saisieEmail,
      permissions
    };

    this.profileService.shareChildProfile(this.selectedChild.id!, shareData).subscribe({
      next: (message) => {
        this.afficherBoiteDialoguePartage = false;
        this.loadingShare = false;
        Swal.fire('Succès', message || 'Profil partagé avec succès.', 'success');
      },
      error: (err) => {
        this.loadingShare = false;
        Swal.fire('Erreur', err.message || 'Impossible de partager le profil.', 'error');
      }
    });
  }
  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }
  cancel() {
    this.newChild = this.resetChild();
    this.displayDialog = false;
  }

  cancelEdit() {
    this.displayEditDialog = false;
  }

  openSigninDialog() {
    // this.dialog.open(Add_popupComponent, {
    //   width: '900px',
    //   maxWidth: '95vw',
    //   panelClass: 'custom-dialog-container',
    //   backdropClass: 'custom-backdrop',
    //   disableClose: false
    // });
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

  resetChild(): Profile {
    return {
      first_name: '',
      last_name: '',
      birth_date: '',
      diagnosis: '',
      notes: '',
      evaluation_score: 0,
      objectives: [],
      progress: 'En progrès',
      recommended_strategies: [],
      image_url: '',
      is_active: true
    };
  }

  updateSkillsChart() {
    if (!this.statistics) return;
    
    // Use real statistics data for doughnut chart with language-specific names
    const labels: string[] = [];
    const data: number[] = [];
    
    for (const categoryStat of this.statistics.categoryStats) {
      // Get language-specific category name
      const category = this.categories.find(cat => cat.id === categoryStat.categoryId);
      const categoryName = category ? this.getLanguageField(category, 'name') : categoryStat.categoryName;
      labels.push(categoryName);
      data.push(categoryStat.totalItems);
    }
    
    this.skillsChartData = {
      ...this.skillsChartData,
      labels,
      datasets: [{ ...this.skillsChartData.datasets[0], data }],
    };
    
    // Update progress chart (bar chart)
    this.updateProgressChart();
    
    // Update line chart
    this.updateLineChart();
    
    // Update polar area chart
    this.updatePolarChart();
  }

  updateProgressChart() {
    if (!this.statistics) return;
    
    const labels: string[] = [];
    const currentProgress: number[] = [];
    const targetProgress: number[] = [];
    
    for (const categoryStat of this.statistics.categoryStats) {
      // Get language-specific category name
      const category = this.categories.find(cat => cat.id === categoryStat.categoryId);
      const categoryName = category ? this.getLanguageField(category, 'name') : categoryStat.categoryName;
      labels.push(categoryName);
      currentProgress.push(categoryStat.progressPercentage);
      targetProgress.push(85); // Target of 85% for all categories
    }
    
    this.progressChartData = {
      ...this.progressChartData,
      labels,
      datasets: [
        { 
          ...this.progressChartData.datasets[0], 
          data: currentProgress,
          label: this.getTranslatedChartLabel('current_progress')
        },
        { 
          ...this.progressChartData.datasets[1], 
          data: targetProgress,
          label: this.getTranslatedChartLabel('target')
        }
      ],
    };
  }

  updateLineChart() {
    if (!this.statistics) return;
    
    const labels: string[] = [];
    const data: number[] = [];
    
    // Use domain statistics for line chart (first 6 domains)
    let domainCount = 0;
    for (const categoryStat of this.statistics.categoryStats) {
      if (domainCount >= 6) break;
      for (const domainStat of categoryStat.domains) {
        if (domainCount >= 6) break;
        // Get language-specific domain name if available
        const category = this.categories.find(cat => cat.id === categoryStat.categoryId);
        const domain = category ? this.domains[category.id!]?.find(d => d.id === domainStat.domainId) : null;
        const domainName = domain ? this.getLanguageFieldForDomain(domain, 'name') : domainStat.domainName;
        labels.push(domainName);
        data.push(domainStat.progressPercentage);
        domainCount++;
      }
    }
    
    this.lineChartData = {
      ...this.lineChartData,
      labels,
      datasets: [{ 
        ...this.lineChartData.datasets[0], 
        data,
        label: this.getTranslatedChartLabel('current_level')
      }],
    };
  }

  updatePolarChart() {
    if (!this.statistics) return;
    
    const labels: string[] = [];
    const data: number[] = [];
    
    for (const categoryStat of this.statistics.categoryStats) {
      // Get language-specific category name
      const category = this.categories.find(cat => cat.id === categoryStat.categoryId);
      const categoryName = category ? this.getLanguageField(category, 'name') : categoryStat.categoryName;
      labels.push(categoryName);
      data.push(categoryStat.totalItems);
    }
    
    this.polarChartData = {
      ...this.polarChartData,
      labels,
      datasets: [{ ...this.polarChartData.datasets[0], data }],
    };
  }

  getCategoryProgress(categoryId: number): number {
    if (!this.statistics) return 0;
    
    const categoryStat = this.statistics.categoryStats.find(cat => cat.categoryId === categoryId);
    return categoryStat ? categoryStat.progressPercentage : 0;
  }

  getLastUpdateDate(): string {
    if (!this.statistics?.recentActivity.lastEvaluationDate) {
      return new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    
    return new Date(this.statistics.recentActivity.lastEvaluationDate).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  loadStatistics(profileId: number): void {
    console.log('Dashboard: Loading statistics for profile:', profileId);
    this.isLoadingStatistics = true;
    this.statistics = null;
    
    this.statisticsService.getProfileStatistics(profileId).subscribe({
      next: (statistics) => {
        console.log('Dashboard: Statistics loaded:', statistics);
        this.statistics = statistics;
        this.updateSkillsChart();
        this.isLoadingStatistics = false;
      },
      error: (error) => {
        console.error('Dashboard: Error loading statistics:', error);
        this.isLoadingStatistics = false;
      }
    });
  }

  // Get current language
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  // Helper method to get the appropriate field based on language
  getLanguageField(category: ProfileCategory, fieldName: string): string {
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

  // Helper method to get language-specific domain name
  getLanguageFieldForDomain(domain: ProfileDomain, fieldName: string): string {
    if (this.currentLanguage === 'ar') {
      // For Arabic language, use _ar fields
      if (fieldName === 'name') {
        return domain.name_ar || domain.name || '';
      } else if (fieldName === 'description') {
        return domain.description_ar || domain.description || '';
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

  // Helper method to get language-specific category name for statistics
  getCategoryNameForStats(categoryStat: any): string {
    // Include current language in the calculation to force re-evaluation
    const currentLang = this.currentLanguage;
    const category = this.categories.find(cat => cat.id === categoryStat.categoryId);
    const categoryName = category ? this.getLanguageField(category, 'name') : categoryStat.categoryName;
    
    // Return the name with a language prefix to ensure uniqueness
    return categoryName;
  }

  // Helper method to get translated chart labels
  getTranslatedChartLabel(key: string): string {
    const translations: { [key: string]: { fr: string, ar: string } } = {
      'current_progress': { fr: 'Progrès Actuel', ar: 'التقدم الحالي' },
      'target': { fr: 'Objectif', ar: 'الهدف' },
      'current_level': { fr: 'Niveau Actuel', ar: 'المستوى الحالي' },
      'competencies': { fr: 'compétences', ar: 'مهارات' }
    };
    
    const translation = translations[key];
    if (translation) {
      return this.currentLanguage === 'ar' ? translation.ar : translation.fr;
    }
    return key;
  }

  // Helper method to get a unique key for forcing template updates
  getLanguageKey(): string {
    return this.currentLanguage;
  }

  // Force refresh statistics display
  refreshStatisticsDisplay() {
    // Force change detection by updating the statistics reference
    if (this.statistics) {
      // Create a deep copy to ensure all nested objects are new references
      this.statistics = JSON.parse(JSON.stringify(this.statistics));
      // Force change detection
      this.cdr.markForCheck();
    }
  }

  // Helper methods to get chart options with language-specific titles
  getSkillsChartOptions(): ChartConfiguration<'doughnut'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { 
            color: '#374151', 
            font: { size: 12, weight: '500' },
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          },
        },
        title: {
          display: true,
          text: this.currentLanguage === 'ar' ? 'توزيع الكفاءات' : 'Répartition des Compétences',
          color: '#1F2937',
          font: { size: 16, weight: 'bold' },
          padding: { top: 10, bottom: 20 }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#ffffff',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
                  callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} ${this.getTranslatedChartLabel('competencies')} (${percentage}%)`;
          }
        }
        }
      },
      cutout: '60%',
      radius: '90%'
    };
  }

  getProgressChartOptions(): ChartConfiguration<'bar'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { 
            color: '#374151', 
            font: { size: 12, weight: '500' },
            usePointStyle: true,
            pointStyle: 'rect'
          },
        },
        title: {
          display: true,
          text: this.currentLanguage === 'ar' ? 'التقدم حسب المجال' : 'Progrès par Domaine',
          color: '#1F2937',
          font: { size: 16, weight: 'bold' },
          padding: { top: 10, bottom: 20 }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#ffffff',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y}%`;
            }
          }
        }
      },
      scales: {
        x: { 
          ticks: { color: '#6B7280', font: { size: 11 } },
          grid: { color: 'rgba(107, 114, 128, 0.1)' }
        },
        y: { 
          ticks: { color: '#6B7280', font: { size: 11 } },
          grid: { color: 'rgba(107, 114, 128, 0.1)' },
          beginAtZero: true, 
          max: 100 
        },
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };
  }

  getLineChartOptions(): ChartConfiguration<'line'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { 
            color: '#374151', 
            font: { size: 12, weight: '500' }
          },
        },
        title: {
          display: true,
          text: this.currentLanguage === 'ar' ? 'تقييم الكفاءات' : 'Évaluation des Compétences',
          color: '#1F2937',
          font: { size: 16, weight: 'bold' },
          padding: { top: 10, bottom: 20 }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#ffffff',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y}%`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#6B7280', font: { size: 11 } },
          grid: { color: 'rgba(107, 114, 128, 0.1)' }
        },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { color: '#6B7280', font: { size: 11 } },
          grid: { color: 'rgba(107, 114, 128, 0.1)' }
        }
      }
    };
  }

  getPolarChartOptions(): ChartConfiguration<'polarArea'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { 
            color: '#374151', 
            font: { size: 11, weight: '500' },
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle'
          },
        },
        title: {
          display: true,
          text: this.currentLanguage === 'ar' ? 'نظرة عامة على المجالات' : 'Vue d\'Ensemble des Domaines',
          color: '#1F2937',
          font: { size: 16, weight: 'bold' },
          padding: { top: 10, bottom: 20 }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#ffffff',
          borderWidth: 1,
          cornerRadius: 8,
                  callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed.r;
            return `${label}: ${value} ${this.getTranslatedChartLabel('competencies')}`;
          }
        }
        }
      },
      scales: {
        r: {
          ticks: {
            color: '#6B7280',
            font: { size: 10 },
            stepSize: 1
          },
          grid: {
            color: 'rgba(107, 114, 128, 0.1)'
          }
        }
      }
    };
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

  navigateToPEU() {
    if (this.selectedChild?.id) {
      this.router.navigate(['/Dashboard-client/client/peu', this.selectedChild.id]);
    } else if (this.childId) {
      this.router.navigate(['/Dashboard-client/client/peu', this.childId]);
    }
  }
}