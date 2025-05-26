import { Component, ElementRef, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileCategoryService } from 'src/app/core/services/ProfileCategory.service';
import { ProfileDomainService } from 'src/app/core/services/ProfileDomain.service';
import { ProfileItemService } from 'src/app/core/services/ProfileItem.service';
import { ProfileCategory } from 'src/app/core/models/ProfileCategory';
import { ProfileDomain } from 'src/app/core/models/ProfileDomain';
import { ProfileItem } from 'src/app/core/models/ProfileItem';
import { forkJoin } from 'rxjs';

interface CategoryWithDomains extends ProfileCategory {
  domains?: ProfileDomain[];
  items?: ProfileItem[];
}
interface DomainWithItems extends ProfileDomain {
  items?: ProfileItem[];
}

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css'],
})
export class ExploreComponent implements OnInit {
  @ViewChild('cardContainer') cardContainer!: ElementRef;
  categories: CategoryWithDomains[] = [];
  currentIndex = 0;
  cardsToShow = 3;
  cardWidth = 300;
  gapWidth = 20;
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

  loadCategories() {
    this.profileId = parseInt(localStorage.getItem('selectedChildId')!, 0);
    this.profileCategoryService.getCategories(this.profileId).subscribe({
      next: (categories) => {
        this.categories = categories;
        categories.forEach(category => {
          if (category.id) {
            this.loadDomainsForCategory(category);
          }
        });
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
        category.domains = domains;
        domains.forEach(domain => {
          if (domain.id) {
            this.loadItemsForDomain(domain, category);
          }
        });
      },
      error: (error) => {
        console.error(`Error loading domains for category ${category.id}:`, error);
      }
    });
  }

  loadItemsForDomain(domain: ProfileDomain, category: CategoryWithDomains) {
    if (!domain.id) return;

    this.profileItemService.getItems(domain.id).subscribe({
      next: (items) => {
        if (!category.items) {
          category.items = [];
        }
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

  scrollLeft(category: CategoryWithDomains, container: HTMLElement) {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateScroll(container);
    }
  }

  scrollRight(category: CategoryWithDomains, container: HTMLElement) {
    if (this.getFilteredDomains(category) && this.currentIndex < this.getFilteredDomains(category).length - this.cardsToShow) {
      this.currentIndex++;
      this.updateScroll(container);
    }
  }

  private updateScroll(container: HTMLElement) {
    const scrollAmount = -(this.currentIndex * (this.cardWidth + this.gapWidth));
    this.renderer.setStyle(
      container,
      'transform',
      `translateX(${scrollAmount}px)`
    );
  }

  calculateProgress(domain: DomainWithItems): number {
    if (!domain.items || domain.items.length === 0) return 0;
    
    const acquiredItems = domain.items.filter(item => item.etat === 'ACQUIS').length;
    const totalItems = domain.items.length;
    return (acquiredItems / totalItems) * 100;
  }

  canScrollLeft(): boolean {
    return this.currentIndex > 0;
  }

  canScrollRight(category: CategoryWithDomains): boolean {
    return this.getFilteredDomains(category) ? 
      this.currentIndex < this.getFilteredDomains(category).length - this.cardsToShow : 
      false;
  }

  getFilteredDomains(category: CategoryWithDomains): ProfileDomain[] {
    if (!category.domains) return [];

    if (this.statusFilter === 'all') {
      return category.domains;
    }

    return category.domains.filter(domain => {
      const percentage = domain.acquis_percentage || 0;
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
    this.currentIndex = 0; // Reset scroll position when filter changes
    this.categories.forEach(category => {
      const container = document.querySelector(`.cards-wrapper`) as HTMLElement;
      if (container) {
        this.updateScroll(container); // Reset scroll position
      }
    });
  }
}