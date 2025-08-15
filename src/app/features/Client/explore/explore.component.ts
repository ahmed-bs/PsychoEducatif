import { Component, ElementRef, OnInit, ViewChildren, QueryList, Renderer2, AfterViewInit, HostListener, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileCategoryService } from 'src/app/core/services/ProfileCategory.service';
import { ProfileDomainService } from 'src/app/core/services/ProfileDomain.service';
import { ProfileItemService } from 'src/app/core/services/ProfileItem.service';
import { ProfileCategory } from 'src/app/core/models/ProfileCategory';
import { ProfileDomain } from 'src/app/core/models/ProfileDomain';
import { ProfileItem } from 'src/app/core/models/ProfileItem';
import { forkJoin } from 'rxjs';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';

interface CategoryWithDomains extends ProfileCategory {
  domains?: DomainWithItems[];
  items?: ProfileItem[];
}

interface DomainWithItems extends ProfileDomain {
  items?: ProfileItem[];
  acquis_count?: number;
  non_acquis_count?: number;
  en_cours_count?: number;
}

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css']
})
export class ExploreComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('cardsWrapper') cardsWrapperQuery!: QueryList<ElementRef>;

  categories: CategoryWithDomains[] = [];
  private categoryScrollIndex = new Map<number, number>();
  private calculatedCardWidth = 0;
  private calculatedGapWidth = 0;
  private calculatedCardsPerView = 0;
  profileId!: number;
  statusFilter: string = 'all';
  currentView: 'card' | 'list' | 'table' = 'card';
  private languageSubscription: Subscription;
  isMobileOrTablet = false;

  constructor(
    private profileCategoryService: ProfileCategoryService,
    private profileDomainService: ProfileDomainService,
    private profileItemService: ProfileItemService,
    private router: Router,
    private renderer: Renderer2,
    private translate: TranslateService,
    private sharedService: SharedService
  ) {
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
    });
    
    // Check initial screen size
    this.checkScreenSize();
  }

  ngOnInit() {
    this.loadCategories();
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.cardsWrapperQuery.changes.subscribe(() => {
      this.calculateCardDimensions();
      this.updateAllScrollPositions();
    });
    if (this.cardsWrapperQuery.length > 0) {
      this.calculateCardDimensions();
      this.updateAllScrollPositions();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.checkScreenSize();
    this.calculateCardDimensions();
    this.updateAllScrollPositions();
  }

  private checkScreenSize() {
    const width = window.innerWidth;
    this.isMobileOrTablet = width <= 1024;
    
    // Force list view on mobile/tablet
    if (this.isMobileOrTablet && this.currentView !== 'list') {
      this.currentView = 'list';
    }
  }

  private calculateCardDimensions() {
    if (this.cardsWrapperQuery && this.cardsWrapperQuery.length > 0) {
      const firstCardWrapper = this.cardsWrapperQuery.first.nativeElement as HTMLElement;
      const firstCard = firstCardWrapper.querySelector('.competence-card') as HTMLElement;

      if (firstCard) {
        const cardStyle = window.getComputedStyle(firstCard);
        this.calculatedCardWidth = firstCard.offsetWidth;
        const cardsWrapperStyle = window.getComputedStyle(firstCardWrapper);
        this.calculatedGapWidth = parseFloat(cardsWrapperStyle.gap || '0');
        if (this.calculatedGapWidth === 0) {
          const cardMarginRight = parseFloat(cardStyle.marginRight || '0');
          this.calculatedGapWidth = cardMarginRight > 0 ? cardMarginRight : 20;
        }

        const scrollerContainer = firstCardWrapper.closest('.horizontal-scroller') as HTMLElement;
        if (scrollerContainer) {
          const containerWidth = scrollerContainer.offsetWidth;
          if (this.calculatedCardWidth + this.calculatedGapWidth > 0) {
            this.calculatedCardsPerView = Math.floor(containerWidth / (this.calculatedCardWidth + this.calculatedGapWidth));
            if (this.calculatedCardsPerView === 0) {
              this.calculatedCardsPerView = 1;
            }
          } else {
            this.calculatedCardsPerView = 1;
          }
        } else {
          this.calculatedCardsPerView = 1;
        }
      }
    }
  }

  loadCategories() {
    this.profileId = parseInt(localStorage.getItem('selectedChildId')!, 0);
    this.profileCategoryService.getCategories(this.profileId).subscribe({
      next: (categories) => {
        this.categories = categories;
        categories.forEach(category => {
          if (category.id) {
            this.loadDomainsForCategory(category);
            this.categoryScrollIndex.set(category.id, 0);
          }
        });
        setTimeout(() => {
          this.calculateCardDimensions();
          this.updateAllScrollPositions();
        }, 0);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.translate.get('explore.error.load_categories_failed').subscribe((text) => {
          console.error(text); // Log translated error
        });
      }
    });
  }

  loadDomainsForCategory(category: CategoryWithDomains) {
    if (!category.id) return;

    this.profileDomainService.getDomains(category.id).subscribe({
      next: (domains) => {
        category.domains = domains as DomainWithItems[];
        domains.forEach(domain => {
          if (domain.id) {
            this.loadItemsForDomain(domain as DomainWithItems, category);
          }
        });
      },
      error: (error) => {
        console.error(`Error loading domains for category ${category.id}:`, error);
        this.translate.get('explore.error.load_domains_failed', { categoryId: category.id }).subscribe((text) => {
          console.error(text);
        });
      }
    });
  }

  loadItemsForDomain(domain: DomainWithItems, category: CategoryWithDomains) {
    if (!domain.id) return;

    this.profileItemService.getItems(domain.id).subscribe({
      next: (items) => {
        domain.items = items;
        domain.acquis_count = items.filter(item => item.etat === 'ACQUIS').length;
        domain.non_acquis_count = items.filter(item => item.etat === 'NON_ACQUIS').length;
        domain.en_cours_count = items.filter(item => item.etat === 'PARTIEL').length;

        if (!category.items) {
          category.items = [];
        }
        category.items = [...category.items, ...items];
      },
      error: (error) => {
        console.error(`Error loading items for domain ${domain.id}:`, error);
        this.translate.get('explore.error.load_items_failed', { domainId: domain.id }).subscribe((text) => {
          console.error(text);
        });
      }
    });
  }

  naviguerVersQuiz(domainId: number | undefined) {
    if (domainId) {
      this.router.navigate(['/Dashboard-client/client/quiz', domainId]);
    }
  }

  scrollLeft(category: CategoryWithDomains, cardsWrapperElement: HTMLElement) {
    const categoryId = category.id;
    if (categoryId === undefined) return;

    let currentIndex = this.categoryScrollIndex.get(categoryId) || 0;
    if (currentIndex > 0) {
      currentIndex = Math.max(0, currentIndex - this.calculatedCardsPerView);
      this.categoryScrollIndex.set(categoryId, currentIndex);
      this.updateScroll(cardsWrapperElement, categoryId);
    }
  }

  scrollRight(category: CategoryWithDomains, cardsWrapperElement: HTMLElement) {
    const categoryId = category.id;
    if (categoryId === undefined) return;

    const filteredDomains = this.getFilteredDomains(category);
    if (!filteredDomains || filteredDomains.length === 0) return;

    let currentIndex = this.categoryScrollIndex.get(categoryId) || 0;
    const maxIndex = filteredDomains.length - this.calculatedCardsPerView;

    if (currentIndex < maxIndex) {
      currentIndex = Math.min(maxIndex, currentIndex + this.calculatedCardsPerView);
      this.categoryScrollIndex.set(categoryId, currentIndex);
      this.updateScroll(cardsWrapperElement, categoryId);
    }
  }

  private updateScroll(cardsWrapperElement: HTMLElement, categoryId: number) {
    const currentIndex = this.categoryScrollIndex.get(categoryId) || 0;
    const scrollAmount = -(currentIndex * (this.calculatedCardWidth + this.calculatedGapWidth));
    
    this.renderer.setStyle(
      cardsWrapperElement,
      'transform',
      `translateX(${scrollAmount}px)`
    );
  }

  private updateAllScrollPositions() {
    this.categories.forEach(category => {
      if (category.id !== undefined) {
        const targetWrapper = this.cardsWrapperQuery.find(
          el => el.nativeElement.closest('.category-section')?.querySelector('h4')?.textContent?.includes(category.name)
          // This is a weak heuristic. A data-attribute on the category-section is better.
          // e.g., <div class="category-section" [attr.data-category-id]="category.id">
          // And then in TS: el.nativeElement.closest(`[data-category-id="${category.id}"]`)?.querySelector('.cards-wrapper')
        )?.nativeElement;

        if (targetWrapper) {
          this.updateScroll(targetWrapper, category.id);
        }
      }
    });
  }

  calculateProgress(domain: DomainWithItems): number {
    if (!domain.items || domain.items.length === 0) return 0;
    
    const acquiredItems = domain.items.filter(item => item.etat === 'ACQUIS').length;
    const totalItems = domain.items.length;
    return (acquiredItems / totalItems) * 100;
  }

  canScrollLeft(category: CategoryWithDomains): boolean {
    const categoryId = category.id;
    if (categoryId === undefined) return false;
    return (this.categoryScrollIndex.get(categoryId) || 0) > 0;
  }

  canScrollRight(category: CategoryWithDomains): boolean {
    const categoryId = category.id;
    if (categoryId === undefined) return false;

    const filteredDomains = this.getFilteredDomains(category);
    if (!filteredDomains || filteredDomains.length === 0) return false;

    const currentIndex = this.categoryScrollIndex.get(categoryId) || 0;
    const maxIndex = filteredDomains.length - this.calculatedCardsPerView;

    return currentIndex < maxIndex;
  }

  getFilteredDomains(category: CategoryWithDomains): DomainWithItems[] {
    if (!category.domains) return [];

    if (this.statusFilter === 'all') {
      return category.domains;
    }

    return category.domains.filter(domain => {
      const percentage = domain.acquis_percentage !== undefined ? domain.acquis_percentage : this.calculateProgress(domain);

      if (this.statusFilter === 'completed') {
        return percentage === 100;
      } else if (this.statusFilter === 'en_cours') {
        return percentage > 0 && percentage < 100;
      } else if (this.statusFilter === 'not_started') {
        return percentage === 0;
      }
      return true;
    });
  }

  applyFilter() {
    this.categories.forEach(category => {
      if (category.id !== undefined) {
        this.categoryScrollIndex.set(category.id, 0);
      }
    });
    this.updateAllScrollPositions();
  }

  setView(view: 'card' | 'list' | 'table') {
    // Don't allow card or table view on mobile/tablet
    if (this.isMobileOrTablet && view !== 'list') {
      return;
    }
    
    this.currentView = view;
    
    // Reset scroll positions when switching views
    this.categories.forEach(category => {
      if (category.id !== undefined) {
        this.categoryScrollIndex.set(category.id, 0);
      }
    });
    
    // Recalculate dimensions for card view after view changes
    if (view === 'card') {
      setTimeout(() => {
        this.calculateCardDimensions();
        this.updateAllScrollPositions();
      }, 0);
    }
  }
}