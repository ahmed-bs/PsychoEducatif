import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProfileItemService } from 'src/app/core/services/ProfileItem.service';
import { ProfileItem } from 'src/app/core/models/ProfileItem';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  standalone: true,
  selector: 'app-evaluations',
  templateUrl: './evaluations.component.html',
  styleUrls: ['./evaluations.component.css'],
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, TranslateModule],
})
export class EvaluationsComponent implements OnInit, OnDestroy {
  domainId: number | null = null;
  items: ProfileItem[] = [];
  profileCategoryName: string | null = null;
  profileDomainName: string | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  currentView: 'table' | 'list' | 'card' = 'table';
  private languageSubscription: Subscription;

  constructor(
    private profileItemService: ProfileItemService,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private sharedService: SharedService
  ) {
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const domainId = params.get('domainId');
      this.domainId = domainId ? +domainId : null;
      console.log('Domain ID:', this.domainId);

      if (this.domainId) {
        this.loadItems();
      } else {
        this.translate.get('evaluations.error.missing_domain_id').subscribe((text) => {
          this.error = text;
        });
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  loadItems(): void {
    this.isLoading = true;
    this.error = null;

    this.profileItemService.getItems(this.domainId!).subscribe({
      next: (items) => {
        this.items = items;
        if (items.length === 0) {
          this.translate.get('evaluations.error.no_items_found').subscribe((text) => {
            this.error = text;
          });
        } else {
          this.profileCategoryName = items[0]?.profile_category_name || this.translate.instant('evaluations.export.unknown_category');
          this.profileDomainName = items[0]?.profile_domain_name || this.translate.instant('evaluations.export.unknown_domain');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading items:', error);
        this.translate.get('evaluations.error.load_items_failed').subscribe((text) => {
          this.error = text;
        });
        this.isLoading = false;
      },
    });
  }

  getEtatLabel(etat: string): string {
    return this.translate.instant('evaluations.table.status_labels.' + etat) || this.translate.instant('evaluations.table.status_labels.NON_COTE');
  }

  switchView(view: 'table' | 'list' | 'card'): void {
    this.currentView = view;
  }

  exportExcel(): void {
    import('xlsx').then((xlsx) => {
      const exportData = [
        { [this.translate.instant('evaluations.export.category_label')]: this.profileCategoryName || this.translate.instant('evaluations.export.unknown_category') },
        { [this.translate.instant('evaluations.export.domain_label')]: this.profileDomainName || this.translate.instant('evaluations.export.unknown_domain') },
        {},
        ...this.items.map((item) => ({
          [this.translate.instant('evaluations.table.headers.items')]: item.description || item.name,
          [this.translate.instant('evaluations.table.headers.status')]: this.getEtatLabel(item.etat),
          [this.translate.instant('evaluations.table.headers.comments')]: item.comentaire && item.comentaire !== item.name ? item.comentaire : this.translate.instant('evaluations.table.no_comment'),
        })),
      ];
      const worksheet = xlsx.utils.json_to_sheet(exportData);
      const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, 'evaluations');
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
    doc.text(`${this.translate.instant('evaluations.export.category_label')}: ${this.profileCategoryName || this.translate.instant('evaluations.export.unknown_category')}`, 40, 20);
    doc.text(`${this.translate.instant('evaluations.export.domain_label')}: ${this.profileDomainName || this.translate.instant('evaluations.export.unknown_domain')}`, 40, 40);

    autoTable(doc, {
      startY: 60,
      head: [[
        this.translate.instant('evaluations.table.headers.items'),
        this.translate.instant('evaluations.table.headers.status'),
        this.translate.instant('evaluations.table.headers.comments')
      ]],
      body: this.items.map((item) => [
        item.description || item.name,
        this.getEtatLabel(item.etat),
        item.comentaire && item.comentaire !== item.name ? item.comentaire : this.translate.instant('evaluations.table.no_comment'),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [0, 123, 255] },
      margin: { top: 60 },
    });

    doc.save('evaluations.pdf');
  }
}