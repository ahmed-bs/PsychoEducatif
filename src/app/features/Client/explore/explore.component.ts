import { Component, ElementRef, OnInit, ViewChildren, QueryList, Renderer2, AfterViewInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileCategoryService } from 'src/app/core/services/ProfileCategory.service';
import { ProfileDomainService } from 'src/app/core/services/ProfileDomain.service';
import { ProfileItemService } from 'src/app/core/services/ProfileItem.service';
import { ProfileCategory } from 'src/app/core/models/ProfileCategory';
import { ProfileDomain } from 'src/app/core/models/ProfileDomain';
import { ProfileItem } from 'src/app/core/models/ProfileItem';
import { forkJoin } from 'rxjs';

interface CategoryWithDomains extends ProfileCategory {
  domains?: DomainWithItems[]; // Ensure this type is used here
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
  styleUrls: ['./explore.component.css'],
})
export class ExploreComponent implements OnInit, AfterViewInit {
  // Use ViewChildren to get all instances of #cardsWrapper
  @ViewChildren('cardsWrapper') cardsWrapperQuery!: QueryList<ElementRef>;

  categories: CategoryWithDomains[] = [];
  
  // Use a Map to store currentIndex for each category's scroller
  private categoryScrollIndex = new Map<number, number>();
  
  // These will be calculated dynamically
  private calculatedCardWidth = 0;
  private calculatedGapWidth = 0;
  private calculatedCardsPerView = 0; // How many full cards can be seen at once

  profileId!: number;
  statusFilter: string = 'all'; // Default to show all domains

  constructor(
    private profileCategoryService: ProfileCategoryService,
    private profileDomainService: ProfileDomainService,
    private profileItemService: ProfileItemService,
    private router: Router,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  // After the view is initialized and content projected
  ngAfterViewInit() {
    // Listen for changes in the QueryList (e.g., categories loaded dynamically)
    this.cardsWrapperQuery.changes.subscribe(() => {
      this.calculateCardDimensions();
      this.updateAllScrollPositions(); // Recalculate and set scroll for all
    });
    // Initial calculation if categories are already loaded on first render
    if (this.cardsWrapperQuery.length > 0) {
      this.calculateCardDimensions();
      this.updateAllScrollPositions();
    }
  }

  // Recalculate dimensions on window resize
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.calculateCardDimensions();
    this.updateAllScrollPositions();
  }

  private calculateCardDimensions() {
    // Only calculate if there's at least one cardsWrapper element
    if (this.cardsWrapperQuery && this.cardsWrapperQuery.length > 0) {
      const firstCardWrapper = this.cardsWrapperQuery.first.nativeElement as HTMLElement;
      const firstCard = firstCardWrapper.querySelector('.competence-card') as HTMLElement;

      if (firstCard) {
        // Get the computed style for accurate width and margin
        const cardStyle = window.getComputedStyle(firstCard);
        this.calculatedCardWidth = firstCard.offsetWidth; // Includes padding and border
        // Get the gap (right margin of the card or the gap property of flex container)
        // Assuming gap is applied as right margin on cards or flex gap.
        // If it's a fixed gap as per your CSS `gap: 20px;` on `.cards-wrapper`, it's simpler.
        const cardsWrapperStyle = window.getComputedStyle(firstCardWrapper);
        this.calculatedGapWidth = parseFloat(cardsWrapperStyle.gap || '0');
        if (this.calculatedGapWidth === 0) {
           // Fallback if gap property is not directly available or supported across all browsers
           // Try to get margin-right of a card element
           const cardMarginRight = parseFloat(cardStyle.marginRight || '0');
           if (cardMarginRight > 0) {
             this.calculatedGapWidth = cardMarginRight;
           } else {
             // As a last resort, use a reasonable default if CSS gap isn't applied or detectable easily
             this.calculatedGapWidth = 20; 
           }
        }
        
        // Calculate how many full cards can fit
        const scrollerContainer = firstCardWrapper.closest('.horizontal-scroller') as HTMLElement;
        if (scrollerContainer) {
          const containerWidth = scrollerContainer.offsetWidth;
          // Calculate how many cards + gaps fit
          if (this.calculatedCardWidth + this.calculatedGapWidth > 0) {
             this.calculatedCardsPerView = Math.floor(containerWidth / (this.calculatedCardWidth + this.calculatedGapWidth));
             // Ensure at least 1 card is always shown
             if (this.calculatedCardsPerView === 0) {
                this.calculatedCardsPerView = 1;
             }
          } else {
            this.calculatedCardsPerView = 1; // Default to 1 if calculation fails
          }
        } else {
          this.calculatedCardsPerView = 1; // Default if scrollerContainer not found
        }
        console.log(`Calculated Card Width: ${this.calculatedCardWidth}, Gap: ${this.calculatedGapWidth}, Cards Per View: ${this.calculatedCardsPerView}`);
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
            // Initialize scroll index for each category
            this.categoryScrollIndex.set(category.id, 0);
          }
        });
        // After categories are loaded and domains populated, trigger dimension calculation
        // and initial scroll position update
        // We defer this slightly to ensure all DOM elements are rendered
        setTimeout(() => {
          this.calculateCardDimensions();
          this.updateAllScrollPositions();
        }, 0); // Use setTimeout to ensure DOM is ready
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadDomainsForCategory(category: CategoryWithDomains) {
    if (!category.id) return;

    this.profileDomainService.getDomains(category.id).subscribe({
      next: (domains) => {
        // Cast to DomainWithItems[] to ensure type safety for additional properties
        category.domains = domains as DomainWithItems[];
        domains.forEach(domain => {
          if (domain.id) {
            this.loadItemsForDomain(domain as DomainWithItems, category); // Cast here too
          }
        });
      },
      error: (error) => {
        console.error(`Error loading domains for category ${category.id}:`, error);
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

        // Ensure category.items is initialized
        if (!category.items) {
          category.items = [];
        }
        // Correctly concatenate items to the category's items array
        category.items = [...category.items, ...items];
      },
      error: (error) => {
        console.error(`Error loading items for domain ${domain.id}:`, error);
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
      currentIndex = Math.max(0, currentIndex - this.calculatedCardsPerView); // Scroll by a view
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
      currentIndex = Math.min(maxIndex, currentIndex + this.calculatedCardsPerView); // Scroll by a view
      this.categoryScrollIndex.set(categoryId, currentIndex);
      this.updateScroll(cardsWrapperElement, categoryId);
    }
  }

  private updateScroll(cardsWrapperElement: HTMLElement, categoryId: number) {
    const currentIndex = this.categoryScrollIndex.get(categoryId) || 0;
    const scrollAmount = -(currentIndex * (this.calculatedCardWidth + this.calculatedGapWidth));
    
    this.renderer.setStyle(
      cardsWrapperElement, // Use the specific element passed from the HTML
      'transform',
      `translateX(${scrollAmount}px)`
    );
  }

  // Update all scroll positions (useful after resize or filter change)
  private updateAllScrollPositions() {
    this.cardsWrapperQuery.forEach((wrapperElRef: ElementRef) => {
        const wrapperElement = wrapperElRef.nativeElement as HTMLElement;
        // Find the corresponding category based on the wrapper element
        // This requires a way to map wrapper to category ID.
        // A robust way would be to add a data-category-id attribute in HTML,
        // or ensure the QueryList order matches categories array.
        // For simplicity, let's assume the order matches or find a parent.
        // A better way would be to pass category.id directly to updateScroll,
        // but it's called internally here.

        // For now, iterate through categories and update based on category ID
        // The `updateScroll` method takes `cardsWrapperElement` and `categoryId`.
        // We need to find which category this `cardsWrapperElement` belongs to.
        // This is a tricky part with `ViewChildren` if not directly passing category object.
        // A simpler approach for `updateAllScrollPositions` might be to trigger a
        // redraw or re-apply transforms for each known category using its ID.

        // A more robust way: map QueryList elements to categories
        const categoryElement = wrapperElement.closest('.category-section');
        if (categoryElement) {
          // You might need a data attribute on category-section or a more complex lookup
          // For now, let's assume `category.id` can be derived or this function only handles visible ones
          // A simpler solution for now is to loop through `categories` and `cardsWrapperQuery` in parallel
          // if their order is guaranteed, or pass the Category object itself from the loop
          // to a dedicated update method.
        }
    });

    // A more straightforward approach for `updateAllScrollPositions` after filter/resize:
    // Re-apply transforms for each category using its stored index.
    this.categories.forEach(category => {
      if (category.id !== undefined) {
        // Find the correct cardsWrapperElement from the QueryList by inspecting its parent structure
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

  // Pass category to enable per-category scroll state check
  canScrollLeft(category: CategoryWithDomains): boolean {
    const categoryId = category.id;
    if (categoryId === undefined) return false;
    return (this.categoryScrollIndex.get(categoryId) || 0) > 0;
  }

  // Pass category to enable per-category scroll state check
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
      // Ensure acquis_percentage is calculated or available
      // It's not part of your original ProfileDomain interface directly from API,
      // but if you calculate it elsewhere or it comes from the backend.
      // For safety, let's use a fallback or calculate if not present.
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
    // Reset all scroll positions to 0 when filter changes
    this.categories.forEach(category => {
      if (category.id !== undefined) {
        this.categoryScrollIndex.set(category.id, 0);
      }
    });
    this.updateAllScrollPositions(); // Reapply transforms
  }
}