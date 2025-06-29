import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-dashboardClient',
  templateUrl: './dashboardClient.component.html',
  styleUrls: ['./dashboardClient.component.css'],
  standalone: true,
  imports: [ButtonModule, DialogModule, InputTextModule, FormsModule, CommonModule, DropdownModule, NgChartsModule],
  providers: [MessageService]
})
export class DashboardClientComponent implements OnInit {
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

  activeTab: string = 'skills'; // Default active tab
  tabs = [
    { id: 'skills', label: 'Compétences' },
    { id: 'goals', label: 'Objectifs' },
    { id: 'strategies', label: 'Stratégies' },
    { id: 'notes', label: 'Notes' }
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
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} compétences (${percentage}%)`;
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
        label: 'Progrès Actuel',
        data: [],
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: 'Objectif',
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

  // Chart data for skill assessment (radar chart)
  radarChartData: ChartConfiguration<'radar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Niveau Actuel',
        data: [],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      }
    ],
  };
  radarChartOptions: ChartConfiguration<'radar'>['options'] = {
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
            return `${context.dataset.label}: ${context.parsed.r}%`;
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#6B7280',
          font: { size: 11 },
          stepSize: 20
        },
        grid: {
          color: 'rgba(107, 114, 128, 0.1)'
        },
        pointLabels: {
          color: '#374151',
          font: { size: 11, weight: '500' }
        }
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
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed.r;
            return `${label}: ${value} compétences`;
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

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private messageService: MessageService,
    private categoryService: ProfileCategoryService, 
    private domainService: ProfileDomainService
  ) {
    this.accesSelectionne = this.optionsAcces[0];
  }

  ngOnInit() {
    const user = localStorage.getItem('user');
    this.parentId = user ? Number(JSON.parse(user).id) : 0;
    this.childId = this.route.snapshot.paramMap.get('childId');
    this.loadChildren();
    if (this.childId) {
      this.loadChild(parseInt(this.childId));
    }
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

  // Computed property to filter categories with domains
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
        // Update all chart data
        this.updateSkillsChart();
      },
      error: (err) => {
        Swal.fire('Erreur', 'Impossible de charger les domaines.', 'error');
      }
    });
  }

  switchTab(tabId: string): void {
    this.activeTab = tabId;
  }

  isTabActive(tabId: string): boolean {
    return this.activeTab === tabId;
  }

  loadChildren() {
    this.profileService.getProfilesByParent(this.parentId).subscribe({
      next: (children) => {
        this.children = children.map(child => ({
          ...child,
          image_url: child.image_url || 'https://source.unsplash.com/random/300x300/?child,portrait'
        }));
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
        this.selectedChild = { ...child };
      },
      error: (err) => {
        Swal.fire('Erreur', 'Impossible de charger le profil.', 'error');
      }
    });
  }

  loadChild(childId: number) {
    this.profileService.getProfileById(childId).subscribe({
      next: (child) => {
        this.selectedChild = {
          ...child,
        };
        this.loadCategories(childId);
      },
      error: (err) => {
        Swal.fire('Erreur', 'Impossible de charger le profil.', 'error');
      }
    });
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
      this.profileService.createChildProfile(this.newChild).subscribe({
        next: (child) => {
          this.children.push({
            ...child,
            image_url: child.image_url || 'https://source.unsplash.com/random/300x300/?child,portrait'
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
    if (this.selectedChild) {
      this.profileService.updateChildProfile(this.selectedChild).subscribe({
        next: (updatedChild) => {
          const index = this.children.findIndex(c => c.id === updatedChild.id);
          if (index !== -1) {
            this.children[index] = { ...updatedChild, image_url: this.children[index].image_url };
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

  shareProfile() {
    if (!this.selectedChild || !this.saisieEmail) {
      Swal.fire('Erreur', 'Veuillez sélectionner un profil et entrer un email.', 'warning');
      return;
    }

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
        Swal.fire('Succès', message || 'Profil partagé avec succès.', 'success');
      },
      error: (err) => {
        Swal.fire('Erreur', err.message || 'Impossible de partager le profil.', 'error');
      }
    });
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
    // Aggregate number of skills per domain for doughnut chart
    const labels: string[] = [];
    const data: number[] = [];
    for (const cat of this.filteredCategories) {
      labels.push(cat.name);
      data.push((this.domains[cat.id!] || []).length);
    }
    this.skillsChartData = {
      ...this.skillsChartData,
      labels,
      datasets: [{ ...this.skillsChartData.datasets[0], data }],
    };
    
    // Update progress chart (bar chart)
    this.updateProgressChart();
    
    // Update radar chart
    this.updateRadarChart();
    
    // Update polar area chart
    this.updatePolarChart();
  }

  updateProgressChart() {
    const labels: string[] = [];
    const currentProgress: number[] = [];
    const targetProgress: number[] = [];
    
    for (const cat of this.filteredCategories) {
      labels.push(cat.name);
      const domains = this.domains[cat.id!] || [];
      const avgProgress = domains.length > 0 
        ? domains.reduce((sum, domain) => sum + (domain.acquis_percentage || 0), 0) / domains.length
        : 0;
      currentProgress.push(Math.round(avgProgress));
      targetProgress.push(85); // Target of 85% for all domains
    }
    
    this.progressChartData = {
      ...this.progressChartData,
      labels,
      datasets: [
        { ...this.progressChartData.datasets[0], data: currentProgress },
        { ...this.progressChartData.datasets[1], data: targetProgress }
      ],
    };
  }

  updateRadarChart() {
    const labels: string[] = [];
    const data: number[] = [];
    
    // Use first 6 domains for radar chart (or all if less than 6)
    let domainCount = 0;
    for (const cat of this.filteredCategories) {
      if (domainCount >= 6) break;
      for (const domain of this.domains[cat.id!] || []) {
        if (domainCount >= 6) break;
        labels.push(domain.name);
        data.push(domain.acquis_percentage || 0);
        domainCount++;
      }
    }
    
    this.radarChartData = {
      ...this.radarChartData,
      labels,
      datasets: [{ ...this.radarChartData.datasets[0], data }],
    };
  }

  updatePolarChart() {
    const labels: string[] = [];
    const data: number[] = [];
    
    for (const cat of this.filteredCategories) {
      labels.push(cat.name);
      data.push((this.domains[cat.id!] || []).length);
    }
    
    this.polarChartData = {
      ...this.polarChartData,
      labels,
      datasets: [{ ...this.polarChartData.datasets[0], data }],
    };
  }

  getCategoryProgress(categoryId: number): number {
    const domains = this.domains[categoryId] || [];
    if (domains.length === 0) return 0;
    
    const totalProgress = domains.reduce((sum, domain) => sum + (domain.acquis_percentage || 0), 0);
    return Math.round(totalProgress / domains.length);
  }

  getLastUpdateDate(): string {
    const today = new Date();
    return today.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}