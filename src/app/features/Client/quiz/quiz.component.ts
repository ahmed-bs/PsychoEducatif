import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileItem } from 'src/app/core/models/ProfileItem';
import { ProfileItemService } from 'src/app/core/services/ProfileItem.service';
import { ProfileDomainService } from 'src/app/core/services/ProfileDomain.service';
import { Location } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css'],
  imports: [
    FormsModule,
    CommonModule,
    TranslateModule
  ]
})
export class QuizComponent implements OnInit, OnDestroy {
  domainId: number = 0;
  items: ProfileItem[] = [];
  domain: any = null;
  currentIndex: number = 0;
  isLoading: boolean = false;
  error: string | null = null;
  showDescriptionPopup: boolean = false;
  showCommentPopup: boolean = false;
  currentView: 'card' | 'list' = 'card';
  currentLanguage: string = 'fr';
  private languageSubscription: Subscription;
  updatingComment: boolean = false;
  currentCommentText: string = '';

  // Helper to get commentaire value (handles both spellings)
  getCommentaire(item: ProfileItem): string {
    if (this.currentLanguage === 'ar') {
      return item.commentaire_ar || (item as any).commentaire || '';
    } else {
      // API returns commentaire (with 'n'), so prioritize that
      return (item as any).commentaire || item.comentaire || '';
    }
  }

  // Helper to set commentaire value (handles both spellings)
  setCommentaire(item: ProfileItem, value: string): void {
    // Set both spellings for compatibility
    (item as any).commentaire = value;
    item.comentaire = value;
  }

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private router: Router,
    private profileItemService: ProfileItemService,
    private profileDomainService: ProfileDomainService,
    private translate: TranslateService,
    private sharedService: SharedService
  ) {
    // Initialize current language
    this.currentLanguage = localStorage.getItem('selectedLanguage') || 'fr';
    
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
      this.currentLanguage = lang;
    });
  }

  // Helper method to get the appropriate field for ProfileItem based on language
  getItemLanguageField(item: ProfileItem, fieldName: string): string {
    if (this.currentLanguage === 'ar') {
      // For Arabic language, use _ar fields
      if (fieldName === 'name') {
        return item.name_ar || '';
      } else if (fieldName === 'description') {
        return item.description_ar || '';
      } else if (fieldName === 'comentaire' || fieldName === 'commentaire') {
        // Check both spellings for backward compatibility
        return item.commentaire_ar || (item as any).commentaire || item.comentaire || '';
      }
    } else {
      // For French language, use non-_ar fields
      if (fieldName === 'name') {
        return item.name || '';
      } else if (fieldName === 'description') {
        return item.description || '';
      } else if (fieldName === 'comentaire' || fieldName === 'commentaire') {
        // Check both spellings for backward compatibility
        return (item as any).commentaire || item.comentaire || '';
      }
    }
    return '';
  }

  // Helper method to get the appropriate field for ProfileDomain based on language
  getDomainLanguageField(domain: any, fieldName: string): string {
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

  ngOnInit(): void {
    // Load saved view from localStorage
    this.currentView = this.getViewFromStorage();
    
    const categoryIdParam = this.route.snapshot.paramMap.get('domainId');

    if (categoryIdParam) {
      this.domainId = parseInt(categoryIdParam);
      this.loadItems();
    } else {
      this.translate.get('skills_evaluation.error.missing_domain_id').subscribe((text) => {
        this.error = text;
      });
    }
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  loadItems() {
    this.isLoading = true;
    this.error = null;
    
    // Load domain information first - we'll need to get the category ID first
    // For now, let's just load items and get domain info from the items if available
    this.profileItemService.getItems(this.domainId).subscribe({
      next: (items) => {
        // Normalize items to ensure both commentaire spellings are available
        // API returns commentaire (with 'n'), so we use that as primary
        this.items = items.map(item => {
          // API returns commentaire (with 'n'), ensure both spellings are available
          const commentaireValue = (item as any).commentaire || item.comentaire || '';
          const normalizedItem = {
            ...item,
            // Set both spellings for compatibility
            comentaire: commentaireValue,
            commentaire: commentaireValue
          } as any;
          return normalizedItem;
        });
        
        if (this.items.length === 0) {
          this.translate.get('skills_evaluation.error.no_questions_found').subscribe((text) => {
            this.error = text;
          });
        } else {
          // Try to get domain info from the first item if available
          if (this.items[0] && this.items[0].profile_domain_name) {
            this.domain = {
              id: this.domainId,
              name: this.items[0].profile_domain_name,
              name_ar: this.items[0].profile_domain_name_ar || '',
              description: '',
              description_ar: ''
            };
          }
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading items:', error);
        this.translate.get('skills_evaluation.error.load_questions_failed').subscribe((text) => {
          this.error = text;
        });
        this.isLoading = false;
      }
    });
  }

  precedent() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  suivant() {
    if (this.currentIndex < this.items.length - 1) {
      this.currentIndex++;
    }
  }

  goBack() {
    this.location.back();
  }

  toggleDescriptionPopup() {
    this.showDescriptionPopup = !this.showDescriptionPopup;
  }

  closeDescriptionPopup() {
    this.showDescriptionPopup = false;
  }

  toggleCommentPopup() {
    if (this.showCommentPopup) {
      this.closeCommentPopup();
    } else {
      this.openCommentPopup();
    }
  }

  openCommentPopup() {
    if (this.items[this.currentIndex]) {
      this.currentCommentText = this.getCommentaire(this.items[this.currentIndex]);
    }
    this.showCommentPopup = true;
  }

  closeCommentPopup() {
    this.showCommentPopup = false;
    this.currentCommentText = '';
    this.updatingComment = false;
  }

  saveComment(): void {
    if (!this.items[this.currentIndex] || !this.items[this.currentIndex].id) return;

    this.updatingComment = true;
    const item = this.items[this.currentIndex];
    const updateData: any = {};
    
    if (this.currentLanguage === 'ar') {
      updateData.commentaire_ar = this.currentCommentText;
      // Keep the French comment if it exists
      const commentaireFr = (item as any).commentaire || item.comentaire || '';
      if (commentaireFr) {
        updateData.commentaire = commentaireFr;
      }
    } else {
      updateData.commentaire = this.currentCommentText;
      // Keep the Arabic comment if it exists
      if (item.commentaire_ar) {
        updateData.commentaire_ar = item.commentaire_ar;
      }
    }

    this.profileItemService.update(item.id, updateData).subscribe({
      next: (updatedItem) => {
        // Update the item in the items array
        const itemIndex = this.items.findIndex(i => i.id === updatedItem.id);
        if (itemIndex !== -1) {
          // Update the item with the new data, preserving both commentaire spellings
          this.items[itemIndex] = {
            ...this.items[itemIndex],
            ...updatedItem,
            // Ensure both spellings are available for compatibility
            comentaire: (updatedItem as any).commentaire || updatedItem.comentaire || '',
            commentaire: (updatedItem as any).commentaire || updatedItem.comentaire || ''
          } as any;
        }
        this.closeCommentPopup();
        this.updatingComment = false;
      },
      error: (error) => {
        console.error('Error updating comment:', error);
        this.updatingComment = false;
        alert(this.translate.instant('dashboard_tabs.strategy.messages.comment_update_error'));
      }
    });
  }

  changeView(view: 'card' | 'list') {
    this.currentView = view;
    localStorage.setItem('quiz-view-mode', view);
  }

  getViewFromStorage(): 'card' | 'list' {
    const savedView = localStorage.getItem('quiz-view-mode');
    return (savedView as 'card' | 'list') || 'card';
  }

  soumettreQuiz() {
    const updatePromises = this.items.map(item => {
      if (item.id) {
        const updateData: any = {
          etat: item.etat,
          description: item.description
        };
        
        // Use commentaire (with 'n') for the PUT request
        // Check both spellings for reading, but always send commentaire
        const commentaireValue = (item as any).commentaire || item.comentaire || '';
        if (commentaireValue) {
          updateData.commentaire = commentaireValue;
        }
        
        // Also preserve commentaire_ar if it exists
        if (item.commentaire_ar) {
          updateData.commentaire_ar = item.commentaire_ar;
        }
        
        return this.profileItemService.update(item.id, updateData).toPromise();
      }
      return Promise.resolve();
    });

    Promise.all(updatePromises)
      .then(() => {
        this.router.navigate(['/Dashboard-client/client/evaluations', this.domainId]);
      })
      .catch(error => {
        console.error('Error updating items:', error);
      });
  }
}