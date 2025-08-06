import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileItem } from 'src/app/core/models/ProfileItem';
import { ProfileItemService } from 'src/app/core/services/ProfileItem.service';
import { ProfileDomainService } from 'src/app/core/services/ProfileDomain.service';
import { Location } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

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
export class QuizComponent implements OnInit {
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
    private profileDomainService: ProfileDomainService,
    private translate: TranslateService
  ) {
    // Initialize translation
    this.translate.addLangs(['fr', 'ar']);
    this.translate.setDefaultLang('ar');
    const browserLang = this.translate.getBrowserLang();
    this.translate.use(browserLang?.match(/fr|ar/) ? browserLang : 'ar');
  }

  ngOnInit(): void {
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

  loadItems() {
    this.isLoading = true;
    this.error = null;
    this.profileItemService.getItems(this.domainId).subscribe({
      next: (items) => {
        this.items = items;
        if (items.length === 0) {
          this.translate.get('skills_evaluation.error.no_questions_found').subscribe((text) => {
            this.error = text;
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
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

  soumettreQuiz() {
    const updatePromises = this.items.map(item => {
      if (item.id) {
        return this.profileItemService.update(item.id, {
          etat: item.etat,
          description: item.description,
          comentaire: item.comentaire
        }).toPromise();
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