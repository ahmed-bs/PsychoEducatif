import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProfileItemService } from 'src/app/core/services/ProfileItem.service';
import { ProfileCategoryService } from 'src/app/core/services/ProfileCategory.service';
import { ProfileDomainService } from 'src/app/core/services/ProfileDomain.service';
import { ProfileItem } from 'src/app/core/models/ProfileItem';
import { ProfileCategory } from 'src/app/core/models/ProfileCategory';
import { ProfileDomain } from 'src/app/core/models/ProfileDomain';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css'],
  imports: [CommonModule, FormsModule, TableModule, ButtonModule],
})
export class SummaryComponent implements OnInit {
  items: ProfileItem[] = [];
  summaryData: any[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  profileId: number = 1; // Default profile ID

  constructor(
    private profileItemService: ProfileItemService,
    private profileCategoryService: ProfileCategoryService,
    private profileDomainService: ProfileDomainService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadSummaryData();
  }

  loadSummaryData(): void {
    this.isLoading = true;
    this.error = null;

    // Load categories first, then domains, then items
    this.profileCategoryService.getCategories(this.profileId).pipe(
      switchMap(categories => {
        const domainRequests = categories.map(category =>
          this.profileDomainService.getDomains(category.id!).pipe(
            catchError(error => {
              console.error(`Error loading domains for category ${category.id}`, error);
              return of([]);
            })
          )
        );
        return forkJoin(domainRequests).pipe(
          switchMap(domainsArrays => {
            const allDomains = domainsArrays.flat();
            const itemRequests = allDomains.map(domain =>
              this.profileItemService.getItems(domain.id).pipe(
                catchError(error => {
                  console.error(`Error loading items for domain ${domain.id}`, error);
                  return of([]);
                })
              )
            );
            return forkJoin(itemRequests);
          })
        );
      })
    ).subscribe({
      next: (itemsArrays) => {
        this.items = itemsArrays.flat();
        this.processSummaryData(this.items);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading summary data:', error);
        this.error = 'Failed to load summary data. Please try again later.';
        this.isLoading = false;
      },
    });
  }

  processSummaryData(items: ProfileItem[]): void {
    // Group items by category and domain for summary
    const groupedData = items.reduce((acc, item) => {
      const category = item.profile_category_name || 'Unknown Category';
      const domain = item.profile_domain_name || 'Unknown Domain';
      
      if (!acc[category]) {
        acc[category] = {};
      }
      if (!acc[category][domain]) {
        acc[category][domain] = [];
      }
      
      acc[category][domain].push(item);
      return acc;
    }, {} as any);

    // Convert to summary data array
    this.summaryData = [];
    Object.keys(groupedData).forEach(category => {
      Object.keys(groupedData[category]).forEach(domain => {
        const domainItems = groupedData[category][domain];
        const acquiredCount = domainItems.filter((item: ProfileItem) => item.etat === 'ACQUIS').length;
        const partialCount = domainItems.filter((item: ProfileItem) => item.etat === 'PARTIEL').length;
        const notAcquiredCount = domainItems.filter((item: ProfileItem) => item.etat === 'NON_ACQUIS').length;
        const notEvaluatedCount = domainItems.filter((item: ProfileItem) => item.etat === 'NON_COTE').length;
        const totalCount = domainItems.length;
        const progressPercentage = totalCount > 0 ? Math.round(((acquiredCount + partialCount * 0.5) / totalCount) * 100) : 0;

        this.summaryData.push({
          category,
          domain,
          totalItems: totalCount,
          acquired: acquiredCount,
          partial: partialCount,
          notAcquired: notAcquiredCount,
          notEvaluated: notEvaluatedCount,
          progressPercentage
        });
      });
    });
  }

  exportExcel(): void {
    import('xlsx').then((xlsx) => {
      const exportData = [
        { 'Résumé des Compétences': 'Export généré le ' + new Date().toLocaleDateString() },
        {},
        ...this.summaryData.map((item) => ({
          'Catégorie': item.category,
          'Domaine': item.domain,
          'Total Items': item.totalItems,
          'Acquises': item.acquired,
          'Partielles': item.partial,
          'Non Acquises': item.notAcquired,
          'Non Évaluées': item.notEvaluated,
          'Progression (%)': item.progressPercentage + '%',
        })),
      ];
      const worksheet = xlsx.utils.json_to_sheet(exportData);
      const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, 'resume_competences');
    });
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
  }

  exportPdf(): void {
    const doc = new jsPDF('p', 'pt');
    doc.text('Résumé des Compétences', 40, 20);
    doc.text('Export généré le ' + new Date().toLocaleDateString(), 40, 40);

    autoTable(doc, {
      startY: 60,
      head: [['Catégorie', 'Domaine', 'Total', 'Acquises', 'Partielles', 'Non Acquises', 'Non Évaluées', 'Progression (%)']],
      body: this.summaryData.map((item) => [
        item.category,
        item.domain,
        item.totalItems.toString(),
        item.acquired.toString(),
        item.partial.toString(),
        item.notAcquired.toString(),
        item.notEvaluated.toString(),
        item.progressPercentage + '%',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [0, 123, 255] },
      margin: { top: 60 },
    });

    doc.save('resume_competences.pdf');
  }
} 