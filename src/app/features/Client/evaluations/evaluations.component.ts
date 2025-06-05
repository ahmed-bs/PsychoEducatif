import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ProfileItemService } from 'src/app/core/services/ProfileItem.service';
import { ProfileItem } from 'src/app/core/models/ProfileItem';

@Component({
  standalone: true,
  selector: 'app-evaluations',
  templateUrl: './evaluations.component.html',
  styleUrls: ['./evaluations.component.css'],
  imports: [CommonModule, FormsModule, TableModule],
})
export class EvaluationsComponent implements OnInit {
  domainId: number | null = null;
  items: ProfileItem[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  profileCategoryName: string | null = null;
  profileDomainName: string | null = null;
  constructor(
    private profileItemService: ProfileItemService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get domainId from route parameters
    this.route.paramMap.subscribe((params) => {
      const domainId = params.get('domainId');
      this.domainId = domainId ? +domainId : null;
      console.log('Domain ID:', this.domainId);

      if (this.domainId) {
        this.loadItems();
      } else {
        this.error = 'Domain ID is missing in the route';
        this.isLoading = false;
      }
    });
  }
  loadItems(): void {
    this.isLoading = true;
    this.error = null;

    this.profileItemService.getItems(this.domainId!).subscribe({
      next: (items) => {
        this.items = items;
        if (items.length === 0) {
          this.error = 'No items found for this domain';
        } else {
          // Extract profile_category_name and profile_domain_name from the first item
          this.profileCategoryName = items[0]?.profile_category_name || 'Unknown Category';
          this.profileDomainName = items[0]?.profile_domain_name || 'Unknown Domain';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading items:', error);
        this.error = 'Failed to load items. Please try again later.';
        this.isLoading = false;
      },
    });
  }
}