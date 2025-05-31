import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ProfileCategoryService } from 'src/app/core/services/ProfileCategory.service';
import { ProfileDomainService } from 'src/app/core/services/ProfileDomain.service';
import { ProfileItemService } from 'src/app/core/services/ProfileItem.service';
import { ProfileItem } from 'src/app/core/models/ProfileItem';
import { ProfileCategory } from 'src/app/core/models/ProfileCategory';
import { ProfileDomain } from 'src/app/core/models/ProfileDomain';

@Component({
  standalone: true,
  selector: 'app-evaluations',
  templateUrl: './evaluations.component.html',
  styleUrls: ['./evaluations.component.css'],
  imports: [CommonModule, FormsModule, TableModule],
})
export class EvaluationsComponent implements OnInit {
  profileId: number | null = null;
  categories: ProfileCategory[] = [];
  domains: ProfileDomain[] = [];
  items: ProfileItem[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private profileCategoryService: ProfileCategoryService,
    private profileDomainService: ProfileDomainService,
    private profileItemService: ProfileItemService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get profileId from localStorage
    const storedProfileId = localStorage.getItem('selectedChildId');
    this.profileId = storedProfileId ? +storedProfileId : null;
    console.log('Profile ID:', this.profileId);

    if (this.profileId) {
      this.loadCategoriesDomainsAndItems();
    } else {
      this.error = 'Profile ID is missing in localStorage';
    }
  }

  loadCategoriesDomainsAndItems(): void {
    this.isLoading = true;
    this.error = null;

    // Step 1: Fetch categories for the profile
    this.profileCategoryService.getCategories(this.profileId!).subscribe({
      next: (categories) => {
        this.categories = categories;
        if (categories && categories.length > 0) {
          // Step 2: Fetch domains for all categories
          this.loadDomainsForCategories(categories);
        } else {
          this.error = 'No categories found for this profile';
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.error = 'Failed to load categories. Please try again later.';
        this.isLoading = false;
      },
    });
  }

  loadDomainsForCategories(categories: ProfileCategory[]): void {
    const domainRequests = categories.map((category) =>
      this.profileDomainService.getDomains(category.id!).toPromise()
    );

    Promise.all(domainRequests)
      .then((results) => {
        // Flatten the array of ProfileDomain arrays
        this.domains = results.flat().filter((domain): domain is ProfileDomain => !!domain);
        if (this.domains.length > 0) {
          // Step 3: Fetch items for all domains
          const domainIds = this.domains.map((domain) => domain.id);
          this.loadItemsForDomains(domainIds);
        } else {
          this.error = 'No domains found for the categories';
          this.isLoading = false;
        }
      })
      .catch((err) => {
        console.error('Error loading domains:', err);
        this.error = 'Failed to load domains. Please try again later.';
        this.isLoading = false;
      });
  }

  loadItemsForDomains(domainIds: number[]): void {
    const itemRequests = domainIds.map((domainId) =>
      this.profileItemService.getItems(domainId).toPromise()
    );

    Promise.all(itemRequests)
      .then((results) => {
        // Flatten the array of ProfileItem arrays
        this.items = results.flat().filter((item): item is ProfileItem => !!item);
        if (this.items.length === 0) {
          this.error = 'No items found for the domains';
        }
        this.isLoading = false;
      })
      .catch((err) => {
        console.error('Error loading items:', err);
        this.error = 'Failed to load items. Please try again later.';
        this.isLoading = false;
      });
  }

  // Helper method to get category name for an item
  getCategoryNameForItem(item: ProfileItem): string {
    const domain = this.domains.find((d) => d.id === item.profile_domain);
    if (domain) {
      const category = this.categories.find((c) => c.id === domain.profile_category);
      return category ? category.name : 'Unknown Category';
    }
    return 'Unknown Category';
  }

  // Helper method to get domain name for an item
  getDomainNameForItem(item: ProfileItem): string {
    const domain = this.domains.find((d) => d.id === item.profile_domain);
    return domain ? domain.name : 'Unknown Domain';
  }
}