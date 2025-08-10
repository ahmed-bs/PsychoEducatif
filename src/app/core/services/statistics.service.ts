import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { ProfileItemService } from './ProfileItem.service';
import { ProfileCategoryService } from './ProfileCategory.service';
import { ProfileDomainService } from './ProfileDomain.service';
import { ProfileItem } from '../models/ProfileItem';
import { ProfileCategory } from '../models/ProfileCategory';
import { ProfileDomain } from '../models/ProfileDomain';

export interface CategoryStatistics {
  categoryId: number;
  categoryName: string;
  totalItems: number;
  acquiredItems: number;
  partialItems: number;
  notAcquiredItems: number;
  notEvaluatedItems: number;
  progressPercentage: number;
  domains: DomainStatistics[];
}

export interface DomainStatistics {
  domainId: number;
  domainName: string;
  totalItems: number;
  acquiredItems: number;
  partialItems: number;
  notAcquiredItems: number;
  notEvaluatedItems: number;
  progressPercentage: number;
  lastEvaluationDate?: string;
}

export interface OverallStatistics {
  totalCategories: number;
  totalDomains: number;
  totalItems: number;
  overallProgress: number;
  categoryStats: CategoryStatistics[];
  recentActivity: {
    lastEvaluatedDomain?: string;
    lastEvaluationDate?: string;
    totalEvaluationsToday: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  constructor(
    private profileItemService: ProfileItemService,
    private profileCategoryService: ProfileCategoryService,
    private profileDomainService: ProfileDomainService
  ) {}

  getProfileStatistics(profileId: number): Observable<OverallStatistics> {
    console.log('Loading statistics for profile:', profileId);
    return this.profileCategoryService.getCategories(profileId).pipe(
      switchMap(categories => {
        console.log('Categories loaded:', categories);
        const categoryRequests = categories.map(category => 
          this.getCategoryStatistics(category, profileId)
        );
        return forkJoin(categoryRequests).pipe(
          map(categoryStats => {
            console.log('Category stats calculated:', categoryStats);
            return this.calculateOverallStatistics(categoryStats);
          })
        );
      }),
      catchError(error => {
        console.error('Error loading profile statistics:', error);
        return of(this.getEmptyStatistics());
      })
    );
  }

  private getCategoryStatistics(category: ProfileCategory, profileId: number): Observable<CategoryStatistics> {
    return this.profileDomainService.getDomains(category.id!).pipe(
      switchMap(domains => {
        const domainRequests = domains.map(domain => 
          this.getDomainStatistics(domain)
        );
        return forkJoin(domainRequests).pipe(
          map(domainStats => this.calculateCategoryStatistics(category, domainStats))
        );
      }),
      catchError(error => {
        console.error(`Error loading statistics for category ${category.id}:`, error);
        return of(this.getEmptyCategoryStatistics(category));
      })
    );
  }

  private getDomainStatistics(domain: ProfileDomain): Observable<DomainStatistics> {
    return this.profileItemService.getItems(domain.id).pipe(
      map(items => this.calculateDomainStatistics(domain, items)),
      catchError(error => {
        console.error(`Error loading items for domain ${domain.id}:`, error);
        return of(this.getEmptyDomainStatistics(domain));
      })
    );
  }

  private calculateDomainStatistics(domain: ProfileDomain, items: ProfileItem[]): DomainStatistics {
    const totalItems = items.length;
    const acquiredItems = items.filter(item => item.etat === 'ACQUIS').length;
    const partialItems = items.filter(item => item.etat === 'PARTIEL').length;
    const notAcquiredItems = items.filter(item => item.etat === 'NON_ACQUIS').length;
    const notEvaluatedItems = items.filter(item => item.etat === 'NON_COTE').length;

    // Calculate progress percentage (ACQUIS + 0.5 * PARTIEL) / total
    const progressPercentage = totalItems > 0 
      ? Math.round(((acquiredItems + (partialItems * 0.5)) / totalItems) * 100)
      : 0;

    // Get the most recent evaluation date
    const lastEvaluationDate = items
      .filter(item => item.etat !== 'NON_COTE' && item.modified_at)
      .sort((a, b) => new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime())[0]?.modified_at;

    return {
      domainId: domain.id,
      domainName: domain.name,
      totalItems,
      acquiredItems,
      partialItems,
      notAcquiredItems,
      notEvaluatedItems,
      progressPercentage,
      lastEvaluationDate
    };
  }

  private calculateCategoryStatistics(category: ProfileCategory, domainStats: DomainStatistics[]): CategoryStatistics {
    const totalItems = domainStats.reduce((sum, domain) => sum + domain.totalItems, 0);
    const acquiredItems = domainStats.reduce((sum, domain) => sum + domain.acquiredItems, 0);
    const partialItems = domainStats.reduce((sum, domain) => sum + domain.partialItems, 0);
    const notAcquiredItems = domainStats.reduce((sum, domain) => sum + domain.notAcquiredItems, 0);
    const notEvaluatedItems = domainStats.reduce((sum, domain) => sum + domain.notEvaluatedItems, 0);

    const progressPercentage = totalItems > 0 
      ? Math.round(((acquiredItems + (partialItems * 0.5)) / totalItems) * 100)
      : 0;

    return {
      categoryId: category.id!,
      categoryName: category.name,
      totalItems,
      acquiredItems,
      partialItems,
      notAcquiredItems,
      notEvaluatedItems,
      progressPercentage,
      domains: domainStats
    };
  }

  private calculateOverallStatistics(categoryStats: CategoryStatistics[]): OverallStatistics {
    const totalCategories = categoryStats.length;
    const totalDomains = categoryStats.reduce((sum, category) => sum + category.domains.length, 0);
    const totalItems = categoryStats.reduce((sum, category) => sum + category.totalItems, 0);
    const overallProgress = totalItems > 0 
      ? Math.round(categoryStats.reduce((sum, category) => sum + (category.progressPercentage * category.totalItems), 0) / totalItems)
      : 0;

    // Calculate recent activity
    const allDomains = categoryStats.flatMap(category => category.domains);
    const evaluatedDomains = allDomains.filter(domain => domain.lastEvaluationDate);
    const lastEvaluatedDomain = evaluatedDomains
      .sort((a, b) => new Date(b.lastEvaluationDate!).getTime() - new Date(a.lastEvaluationDate!).getTime())[0];

    const today = new Date().toISOString().split('T')[0];
    const totalEvaluationsToday = evaluatedDomains
      .filter(domain => domain.lastEvaluationDate?.startsWith(today))
      .length;

    return {
      totalCategories,
      totalDomains,
      totalItems,
      overallProgress,
      categoryStats,
      recentActivity: {
        lastEvaluatedDomain: lastEvaluatedDomain?.domainName,
        lastEvaluationDate: lastEvaluatedDomain?.lastEvaluationDate,
        totalEvaluationsToday
      }
    };
  }

  private getEmptyStatistics(): OverallStatistics {
    return {
      totalCategories: 0,
      totalDomains: 0,
      totalItems: 0,
      overallProgress: 0,
      categoryStats: [],
      recentActivity: {
        totalEvaluationsToday: 0
      }
    };
  }

  private getEmptyCategoryStatistics(category: ProfileCategory): CategoryStatistics {
    return {
      categoryId: category.id!,
      categoryName: category.name,
      totalItems: 0,
      acquiredItems: 0,
      partialItems: 0,
      notAcquiredItems: 0,
      notEvaluatedItems: 0,
      progressPercentage: 0,
      domains: []
    };
  }

  private getEmptyDomainStatistics(domain: ProfileDomain): DomainStatistics {
    return {
      domainId: domain.id,
      domainName: domain.name,
      totalItems: 0,
      acquiredItems: 0,
      partialItems: 0,
      notAcquiredItems: 0,
      notEvaluatedItems: 0,
      progressPercentage: 0
    };
  }
}
