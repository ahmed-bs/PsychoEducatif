import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProfileItemService } from 'src/app/core/services/ProfileItem.service';
import { ProfileItem } from 'src/app/core/models/ProfileItem';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Import autoTable explicitly
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';

// Utility function to handle Arabic text encoding
function encodeArabicText(text: string): string {
  // For Arabic text, we need to ensure proper encoding
  // This function helps prevent character corruption
  if (!text) return '';
  
  // Check if text contains Arabic characters
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  if (arabicRegex.test(text)) {
    // For Arabic text, we'll use a different encoding approach
    // Convert to UTF-8 and handle properly
    try {
      // Normalize the text and ensure proper encoding
      const normalized = text.normalize('NFC');
      // For PDF compatibility, we might need to handle this differently
      return normalized;
    } catch (error) {
      console.warn('Error encoding Arabic text:', error);
      return text;
    }
  }
  
  return text;
}

// Function to check if text contains Arabic characters
function containsArabic(text: string): boolean {
  if (!text) return false;
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
}

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
  filteredItems: ProfileItem[] = [];
  profileCategoryName: string | null = null;
  profileDomainName: string | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  currentLanguage: string = 'fr';
  selectedStatusFilter: string = 'ALL';
  private languageSubscription: Subscription;

  constructor(
    private profileItemService: ProfileItemService,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize current language
    this.currentLanguage = localStorage.getItem('selectedLanguage') || 'fr';
    
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
      this.currentLanguage = lang;
      // Update category and domain names when language changes
      if (this.items.length > 0) {
        this.profileCategoryName = this.getLanguageSpecificCategoryName();
        this.profileDomainName = this.getLanguageSpecificDomainName();
      }
      // Force change detection
      this.cdr.detectChanges();
    });
  }

  // Helper method to get the appropriate field for ProfileItem based on language
  getItemLanguageField(item: ProfileItem, fieldName: string): string {
    if (this.currentLanguage === 'ar') {
      // For Arabic language, use _ar fields
      if (fieldName === 'name') {
        return item.name_ar || '';
      } else if (fieldName === 'description') {
        return item.description_ar || '';
      } else if (fieldName === 'comentaire') {
        return item.commentaire_ar || '';
      }
    } else {
      // For French language, use non-_ar fields
      if (fieldName === 'name') {
        return item.name || '';
      } else if (fieldName === 'description') {
        return item.description || '';
      } else if (fieldName === 'comentaire') {
        return item.comentaire || '';
      }
    }
    return '';
  }

  ngOnInit(): void {
    // Initialize translation with current language from shared service
    this.translate.setDefaultLang('fr');
    const currentLang = this.sharedService.getCurrentLanguage();
    this.translate.use(currentLang);

    this.route.paramMap.subscribe((params) => {
      const domainId = params.get('domainId');
      this.domainId = domainId ? +domainId : null;
      console.log('Domain ID:', this.domainId);

      if (this.domainId) {
        this.loadItems();
      } else {
        this.error = this.translate.instant('evaluations.error.missing_domain_id');
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  // Get current language
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  // Helper method to get language-specific category name
  public getLanguageSpecificCategoryName(): string {
    if (this.items.length > 0) {
      const item = this.items[0];
      if (this.currentLanguage === 'ar') {
        return item.profile_category_name_ar || item.profile_category_name || this.translate.instant('evaluations.export.unknown_category');
      } else {
        return item.profile_category_name || this.translate.instant('evaluations.export.unknown_category');
      }
    }
    return this.translate.instant('evaluations.export.unknown_category');
  }

  // Helper method to get language-specific domain name
  public getLanguageSpecificDomainName(): string {
    if (this.items.length > 0) {
      const item = this.items[0];
      if (this.currentLanguage === 'ar') {
        return item.profile_domain_name_ar || item.profile_domain_name || this.translate.instant('evaluations.export.unknown_domain');
      } else {
        return item.profile_domain_name || this.translate.instant('evaluations.export.unknown_domain');
      }
    }
    return this.translate.instant('evaluations.export.unknown_domain');
  }

  loadItems(): void {
    this.isLoading = true;
    this.error = null;

    this.profileItemService.getItems(this.domainId!).subscribe({
      next: (items) => {
        this.items = items;
        this.filteredItems = items; // Initialize filtered items
        if (items.length === 0) {
          this.error = this.translate.instant('evaluations.error.no_items_found');
        } else {
          // Use language-specific names
          this.profileCategoryName = this.getLanguageSpecificCategoryName();
          this.profileDomainName = this.getLanguageSpecificDomainName();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading items:', error);
        this.error = this.translate.instant('evaluations.error.load_items_failed');
        this.isLoading = false;
      },
    });
  }

  // Filter items by status
  filterByStatus(): void {
    if (this.selectedStatusFilter === 'ALL') {
      this.filteredItems = [...this.items];
    } else {
      this.filteredItems = this.items.filter(item => item.etat === this.selectedStatusFilter);
    }
  }

  // Get available status options for filter dropdown
  getStatusOptions(): Array<{value: string, label: string}> {
    return [
      { value: 'ALL', label: this.translate.instant('evaluations.filter.all_status') },
      { value: 'ACQUIS', label: this.translate.instant('evaluations.table.status_labels.ACQUIS') },
      { value: 'NON_ACQUIS', label: this.translate.instant('evaluations.table.status_labels.NON_ACQUIS') },
      { value: 'PARTIEL', label: this.translate.instant('evaluations.table.status_labels.PARTIEL') },
      { value: 'NON_COTE', label: this.translate.instant('evaluations.table.status_labels.NON_COTE') }
    ];
  }

  // Get filter label for export
  getFilterLabel(): string {
    if (this.selectedStatusFilter === 'ALL') {
      return this.translate.instant('evaluations.filter.all_status');
    } else {
      return this.getStatusLabel(this.selectedStatusFilter);
    }
  }

  exportExcel(): void {
    import('xlsx').then((xlsx) => {
      const exportData = [
        { [this.translate.instant('evaluations.export.category_label')]: this.getLanguageSpecificCategoryName() },
        { [this.translate.instant('evaluations.export.domain_label')]: this.getLanguageSpecificDomainName() },
        { [this.translate.instant('evaluations.export.filter_label')]: this.getFilterLabel() },
        {},
        ...this.filteredItems.map((item) => ({
          [this.translate.instant('evaluations.table.headers.items')]: this.getItemLanguageField(item, 'description') || this.getItemLanguageField(item, 'name'),
          [this.translate.instant('evaluations.table.headers.status')]: this.getStatusLabel(item.etat),
          [this.translate.instant('evaluations.table.headers.comments')]: this.getItemLanguageField(item, 'comentaire') || this.translate.instant('evaluations.table.no_comment'),
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
    const currentLang = this.currentLanguage;
    
    // For Arabic text, we need a different approach
    if (currentLang === 'ar' || containsArabic(this.getLanguageSpecificCategoryName()) || containsArabic(this.getLanguageSpecificDomainName())) {
      this.exportPdfArabic();
    } else {
      this.exportPdfStandard();
    }
  }

  private exportPdfStandard(): void {
    const doc = new jsPDF('p', 'pt');
    
    // Set font and size
    doc.setFont('helvetica');
    doc.setFontSize(12);

    // Add header text
    const categoryText = `${this.translate.instant('evaluations.export.category_label')}: ${this.getLanguageSpecificCategoryName()}`;
    const domainText = `${this.translate.instant('evaluations.export.domain_label')}: ${this.getLanguageSpecificDomainName()}`;
    
    doc.text(categoryText, 40, 20);
    doc.text(domainText, 40, 40);

    // Prepare table data
    const tableData = this.filteredItems.map((item) => [
      this.getItemLanguageField(item, 'description') || this.getItemLanguageField(item, 'name'),
      this.getStatusLabel(item.etat),
      this.getItemLanguageField(item, 'comentaire') || this.translate.instant('evaluations.table.no_comment'),
    ]);

    // Apply autoTable
    autoTable(doc, {
      startY: 60,
      head: [[
        this.translate.instant('evaluations.table.headers.items'),
        this.translate.instant('evaluations.table.headers.status'),
        this.translate.instant('evaluations.table.headers.comments')
      ]],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [0, 123, 255],
        font: 'helvetica',
        fontSize: 10
      },
      bodyStyles: {
        font: 'helvetica',
        fontSize: 9
      },
      margin: { top: 60 },
      styles: {
        font: 'helvetica',
        fontSize: 9
      }
    });

    doc.save('evaluations.pdf');
  }

  private exportPdfArabic(): void {
    // For Arabic text, we'll use a different approach
    // We'll create an HTML file and open it in a new window for printing
    // This approach should handle Arabic text much better
    
    const htmlContent = this.generateArabicHtml();
    
    // Create a blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Open in new window for printing
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        // Clean up the URL after printing
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      };
    } else {
      // Fallback: download as HTML file
      const link = document.createElement('a');
      link.href = url;
      link.download = 'evaluations.html';
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  private generateArabicHtml(): string {
    // Generate HTML content for Arabic text
    let html = `
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير التقييم</h1>
        </div>
        <div class="info">
          <p><strong>الفئة:</strong> ${this.getLanguageSpecificCategoryName()}</p>
          <p><strong>المجال:</strong> ${this.getLanguageSpecificDomainName()}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>العناصر</th>
              <th>الحالة</th>
              <th>التعليقات</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    this.filteredItems.forEach(item => {
      const itemText = this.getItemLanguageField(item, 'description') || this.getItemLanguageField(item, 'name') || '';
      const statusText = this.getStatusLabel(item.etat);
      const commentText = this.getItemLanguageField(item, 'comentaire') || this.translate.instant('evaluations.table.no_comment');
      
      html += `
        <tr>
          <td>${itemText}</td>
          <td>${statusText}</td>
          <td>${commentText}</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    return html;
  }

  private splitTextToFit(text: string, maxWidth: number): string[] {
    if (!text) return [''];
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length * 6 <= maxWidth) { // Approximate character width
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word);
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.length > 0 ? lines : [''];
  }

  private getStatusLabel(etat: string): string {
    switch (etat) {
      case 'ACQUIS':
        return this.translate.instant('evaluations.table.status_labels.ACQUIS');
      case 'NON_ACQUIS':
        return this.translate.instant('evaluations.table.status_labels.NON_ACQUIS');
      case 'PARTIEL':
        return this.translate.instant('evaluations.table.status_labels.PARTIEL');
      case 'NON_COTE':
        return this.translate.instant('evaluations.table.status_labels.NON_COTE');
      default:
        return this.translate.instant('evaluations.table.status_labels.NON_COTE');
    }
  }
}