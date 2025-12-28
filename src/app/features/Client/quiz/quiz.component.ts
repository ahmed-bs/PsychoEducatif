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
  showStrategyPopup: boolean = false;
  currentView: 'card' | 'list' = 'card';
  currentLanguage: string = 'fr';
  private languageSubscription: Subscription;
  updatingComment: boolean = false;
  updatingStrategy: boolean = false;
  currentCommentText: string = '';
  currentStrategyText: string = '';

  // Helper to get commentaire value (handles both spellings)
  getCommentaire(item: ProfileItem): string {
    if (this.currentLanguage === 'ar') {
      return item.commentaire_ar || (item as any).commentaire || '';
    } else if (this.currentLanguage === 'en') {
      return (item as any).commentaire_en || (item as any).commentaire || item.comentaire || '';
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
      } else if (fieldName === 'strategie') {
        return item.strategie_ar || item.strategie || '';
      }
    } else if (this.currentLanguage === 'en') {
      // For English language, use _en fields
      if (fieldName === 'name') {
        return (item as any).name_en || item.name || '';
      } else if (fieldName === 'description') {
        return (item as any).description_en || item.description || '';
      } else if (fieldName === 'comentaire' || fieldName === 'commentaire') {
        // Check both spellings for backward compatibility
        return (item as any).commentaire_en || (item as any).commentaire || item.comentaire || '';
      } else if (fieldName === 'strategie') {
        return (item as any).strategie_en || item.strategie || '';
      }
    } else {
      // For French language, use non-_ar/_en fields
      if (fieldName === 'name') {
        return item.name || '';
      } else if (fieldName === 'description') {
        return item.description || '';
      } else if (fieldName === 'comentaire' || fieldName === 'commentaire') {
        // Check both spellings for backward compatibility
        return (item as any).commentaire || item.comentaire || '';
      } else if (fieldName === 'strategie') {
        return item.strategie || '';
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
    } else if (this.currentLanguage === 'en') {
      // For English language, use _en fields
      if (fieldName === 'name') {
        return domain.name_en || domain.name || '';
      } else if (fieldName === 'description') {
        return domain.description_en || domain.description || '';
      }
    } else {
      // For French language, use non-_ar/_en fields
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
              name_en: (this.items[0] as any).profile_domain_name_en || '',
              description: '',
              description_ar: '',
              description_en: ''
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

  currentStrategyItemIndex: number = 0;

  toggleStrategyPopup(itemIndex?: number) {
    if (this.showStrategyPopup) {
      this.closeStrategyPopup();
    } else {
      this.openStrategyPopup(itemIndex);
    }
  }

  openStrategyPopup(itemIndex?: number) {
    const index = itemIndex !== undefined ? itemIndex : this.currentIndex;
    this.currentStrategyItemIndex = index;
    if (this.items[index]) {
      if (this.currentLanguage === 'ar') {
        this.currentStrategyText = this.items[index].strategie_ar || this.items[index].strategie || '';
      } else if (this.currentLanguage === 'en') {
        this.currentStrategyText = (this.items[index] as any).strategie_en || this.items[index].strategie || '';
      } else {
        this.currentStrategyText = this.items[index].strategie || '';
      }
    }
    this.showStrategyPopup = true;
  }

  closeStrategyPopup() {
    this.showStrategyPopup = false;
    this.currentStrategyText = '';
    this.updatingStrategy = false;
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
      // Keep the English comment if it exists
      if ((item as any).commentaire_en) {
        updateData.commentaire_en = (item as any).commentaire_en;
      }
    } else if (this.currentLanguage === 'en') {
      updateData.commentaire_en = this.currentCommentText;
      // Keep the French comment if it exists
      const commentaireFr = (item as any).commentaire || item.comentaire || '';
      if (commentaireFr) {
        updateData.commentaire = commentaireFr;
      }
      // Keep the Arabic comment if it exists
      if (item.commentaire_ar) {
        updateData.commentaire_ar = item.commentaire_ar;
      }
    } else {
      updateData.commentaire = this.currentCommentText;
      // Keep the Arabic comment if it exists
      if (item.commentaire_ar) {
        updateData.commentaire_ar = item.commentaire_ar;
      }
      // Keep the English comment if it exists
      if ((item as any).commentaire_en) {
        updateData.commentaire_en = (item as any).commentaire_en;
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

  saveStrategy(): void {
    const itemIndex = this.currentStrategyItemIndex;
    if (!this.items[itemIndex] || !this.items[itemIndex].id) return;

    this.updatingStrategy = true;
    const item = this.items[itemIndex];
    const updateData: any = {};
    if (this.currentLanguage === 'ar') {
      updateData.strategie_ar = this.currentStrategyText;
    } else if (this.currentLanguage === 'en') {
      updateData.strategie_en = this.currentStrategyText;
    } else {
      updateData.strategie = this.currentStrategyText;
    }

    this.profileItemService.update(item.id, updateData).subscribe({
      next: (updatedItem) => {
        // Update the item in the items array
        const updatedItemIndex = this.items.findIndex(i => i.id === updatedItem.id);
        if (updatedItemIndex !== -1) {
          this.items[updatedItemIndex] = {
            ...this.items[updatedItemIndex],
            ...updatedItem
          };
        }
        this.closeStrategyPopup();
        this.updatingStrategy = false;
      },
      error: (error) => {
        console.error('Error updating strategy:', error);
        this.updatingStrategy = false;
        alert(this.translate.instant('skills_evaluation.popup.strategy_update_error'));
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
          etat: item.etat
        };
        
        // Set description based on language
        if (this.currentLanguage === 'ar') {
          updateData.description_ar = item.description_ar || item.description || '';
        } else if (this.currentLanguage === 'en') {
          updateData.description_en = (item as any).description_en || item.description || '';
        } else {
          updateData.description = item.description || '';
        }
        
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
        
        // Also preserve commentaire_en if it exists
        if ((item as any).commentaire_en) {
          updateData.commentaire_en = (item as any).commentaire_en;
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