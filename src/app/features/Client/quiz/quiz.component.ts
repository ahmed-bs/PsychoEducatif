import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileItem } from 'src/app/core/models/ProfileItem';
import { ProfileItemService } from 'src/app/core/services/ProfileItem.service';
import { ProfileDomainService } from 'src/app/core/services/ProfileDomain.service';
import { Location } from '@angular/common';
@Component({
  standalone: true,
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css'],
  imports: [
    FormsModule,
    CommonModule
  ]
})
export class QuizComponent implements OnInit {
  categoryId: number = 0;
  domainId: number = 0;
  items: ProfileItem[] = [];
  currentIndex: number = 0;
  isLoading: boolean = false;
  error: string | null = null;
  
  constructor(
     private location: Location,
    private route: ActivatedRoute,
    private router: Router,
    private profileItemService: ProfileItemService,
    private profileDomainService: ProfileDomainService
  ) {}

  ngOnInit(): void {
    const categoryIdParam = this.route.snapshot.paramMap.get('domainId');
console.log('categoryIdParam:', categoryIdParam);

    if (categoryIdParam) {
      this.categoryId = +categoryIdParam;
      this.loadItems();
    } else {
      this.error = "Category ID is required";
    }
  }

  loadItems() {
    this.isLoading = true;
    this.error = null;

    // First get the domain for this category
    // this.profileDomainService.getDomains(this.categoryId).subscribe({
      // next: (domains) => {
        // if (domains && domains.length > 0) {
        //   this.domainId = domains[0].id;
          // Then get the items for this domain
          this.profileItemService.getItems(this.categoryId).subscribe({
            next: (items) => {
              this.items = items;
              if (items.length === 0) {
                this.error = "No questions found for this domain";
              }
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error loading items:', error);
              this.error = "Failed to load questions. Please try again later.";
              this.isLoading = false;
            }
          });
        // } else {
        //   this.error = "No domains found for this category";
        //   this.isLoading = false;
        // }
      // },
      // error: (error) => {
      //   console.error('Error loading domains:', error);
      //   this.error = "Failed to load domain information. Please try again later.";
      //   this.isLoading = false;
      // }
    // });
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
  soumettreQuiz() {
    // Update all items
    const updatePromises = this.items.map(item => {
      if (item.id) {
        return this.profileItemService.update(item.id, {
          etat: item.etat,
          description: item.description
        }).toPromise();
      }
      return Promise.resolve();
    });

    Promise.all(updatePromises)
      .then(() => {
        this.router.navigate(['/Dashboard-client/client/evaluations', this.categoryId]);
      })
      .catch(error => {
        console.error('Error updating items:', error);
      });
  }
}
