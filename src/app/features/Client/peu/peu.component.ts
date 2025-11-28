import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileItemListComponent } from 'src/app/shared/profile-item-list/profile-item-list.component';
import { ProfileItem } from 'src/app/core/models/ProfileItem';
import { ProfileItemService } from 'src/app/core/services/ProfileItem.service';
import { ProfileCategoryService } from 'src/app/core/services/ProfileCategory.service';
import { ProfileDomainService } from 'src/app/core/services/ProfileDomain.service';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Function to check if text contains Arabic characters
function containsArabic(text: string): boolean {
  if (!text) return false;
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
}

@Component({
  standalone: true,
  selector: 'app-peu',
  templateUrl: './peu.component.html',
  styleUrls: ['./peu.component.css'],
  imports: [
    CommonModule,
    ProfileItemListComponent,
    ButtonModule,
    TranslateModule
  ]
})
export class PeuComponent implements OnInit, OnDestroy {
  profileId: number | null = null;
  items: ProfileItem[] = [];
  selectedItemIds: number[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  currentLanguage: string = 'fr';
  private languageSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private profileItemService: ProfileItemService,
    private profileCategoryService: ProfileCategoryService,
    private profileDomainService: ProfileDomainService,
    private translate: TranslateService,
    private sharedService: SharedService
  ) {
    // Initialize current language
    this.currentLanguage = localStorage.getItem('selectedLanguage') || 'fr';
    this.translate.use(this.currentLanguage);
    
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
      this.currentLanguage = lang;
    });
  }

  ngOnInit() {
    // Get profileId from route params or localStorage
    this.route.params.subscribe(params => {
      const childId = params['childId'];
      if (childId) {
        this.profileId = parseInt(childId, 10);
        this.loadItems();
      } else {
        // Try to get from localStorage
        const storedChildId = localStorage.getItem('selectedChildId');
        if (storedChildId) {
          this.profileId = parseInt(storedChildId, 10);
          this.loadItems();
        } else {
          this.error = this.translate.instant('peu.no_profile_selected');
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  loadItems() {
    if (!this.profileId) {
      this.error = this.translate.instant('peu.no_profile_id');
      return;
    }

    this.isLoading = true;
    this.error = null;

    // Load all categories, then domains, then items
    this.profileCategoryService.getCategories(this.profileId).pipe(
      switchMap(categories => {
        const categoryRequests = categories.map(category => 
          this.profileDomainService.getDomains(category.id || 0).pipe(
            switchMap(domains => {
              const domainRequests = domains.map(domain => 
                this.profileItemService.getPeuItems(domain.id).pipe(
                  catchError(error => {
                    console.error(`Error loading PEU items for domain ${domain.id}:`, error);
                    return of([]);
                  })
                )
              );
              return forkJoin(domainRequests).pipe(
                switchMap(itemsArrays => {
                  // Flatten all items and add category/domain info
                  const allItems: ProfileItem[] = [];
                  itemsArrays.forEach((items, index) => {
                    items.forEach(item => {
                      allItems.push({
                        ...item,
                        profile_domain: domains[index].id || 0,
                        profile_domain_name: domains[index].name || '',
                        profile_domain_name_ar: domains[index].name_ar || '',
                        profile_category_name: category.name || '',
                        profile_category_name_ar: category.name_ar || ''
                      });
                    });
                  });
                  return of(allItems);
                })
              );
            }),
            catchError(error => {
              console.error(`Error loading domains for category ${category.id}:`, error);
              return of([]);
            })
          )
        );
        return forkJoin(categoryRequests);
      })
    ).subscribe({
      next: (results) => {
        // Flatten all items from all categories
        this.items = results.flat();
        // Initialize selected items based on done field
        this.selectedItemIds = this.items
          .filter(item => item.done === true)
          .map(item => item.id);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading items:', error);
        this.error = this.translate.instant('peu.failed_to_load');
        this.isLoading = false;
      }
    });
  }

  onSelectionChange(selectedIds: number[]) {
    const previousSelectedIds = new Set(this.selectedItemIds);
    const currentSelectedIds = new Set(selectedIds);
    
    // Find items that were checked (added to selection)
    const checkedItems = selectedIds.filter(id => !previousSelectedIds.has(id));
    
    // Find items that were unchecked (removed from selection)
    const uncheckedItems = Array.from(previousSelectedIds).filter(id => !currentSelectedIds.has(id));
    
    // Update selectedItemIds immediately for UI responsiveness
    this.selectedItemIds = selectedIds;
    
    // Update checked items (set done to true)
    checkedItems.forEach(itemId => {
      this.profileItemService.updateStatus(itemId, true, true).subscribe({
        next: (updatedItem) => {
          // Update the item in the local array
          const index = this.items.findIndex(item => item.id === itemId);
          if (index !== -1) {
            this.items[index] = { ...this.items[index], done: true, isPeu: true };
          }
        },
        error: (error) => {
          console.error(`Error updating item ${itemId}:`, error);
          // Revert selection on error
          this.selectedItemIds = this.selectedItemIds.filter(id => id !== itemId);
        }
      });
    });
    
    // Update unchecked items (set done to false)
    uncheckedItems.forEach(itemId => {
      this.profileItemService.updateStatus(itemId, true, false).subscribe({
        next: (updatedItem) => {
          // Update the item in the local array
          const index = this.items.findIndex(item => item.id === itemId);
          if (index !== -1) {
            this.items[index] = { ...this.items[index], done: false, isPeu: true };
          }
        },
        error: (error) => {
          console.error(`Error updating item ${itemId}:`, error);
          // Revert selection on error
          this.selectedItemIds = [...this.selectedItemIds, itemId];
        }
      });
    });
  }

  goBack() {
    if (this.profileId) {
      this.router.navigate(['/Dashboard-client/client', this.profileId]);
    } else {
      this.router.navigate(['/Dashboard-client/client']);
    }
  }

  exportExcel(): void {
    if (this.items.length === 0) {
      return;
    }

    import('xlsx').then((xlsx) => {
      const categoryLabel = this.translate.instant('peu.export.category');
      const domainLabel = this.translate.instant('peu.export.domain');
      const itemNameLabel = this.translate.instant('peu.export.item_name');
      const descriptionLabel = this.translate.instant('peu.export.description');
      const commentsLabel = this.translate.instant('peu.export.comments');
      const doneLabel = this.translate.instant('peu.export.done');
      
      const exportData = this.items.map((item) => ({
        [categoryLabel]: this.getItemLanguageField(item, 'category'),
        [domainLabel]: this.getItemLanguageField(item, 'domain'),
        [itemNameLabel]: this.getItemLanguageField(item, 'name'),
        [descriptionLabel]: this.getItemLanguageField(item, 'description'),
        [commentsLabel]: this.getItemLanguageField(item, 'comentaire') || '',
        [doneLabel]: item.done ? this.translate.instant('peu.export.done') : '',
      }));

      const worksheet = xlsx.utils.json_to_sheet(exportData);
      const sheetName = this.translate.instant('peu.export.title');
      const workbook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, 'peu_items');
    });
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
  }

  exportPdf(): void {
    if (this.items.length === 0) {
      return;
    }

    // Check if we need to use Arabic PDF export
    const hasArabicContent = this.currentLanguage === 'ar' || 
      this.items.some(item => 
        containsArabic(item.name_ar || '') || 
        containsArabic(item.description_ar || '') ||
        containsArabic(item.profile_category_name_ar || '') ||
        containsArabic(item.profile_domain_name_ar || '')
      );

    if (hasArabicContent) {
      this.exportPdfArabic();
    } else {
      this.exportPdfStandard();
    }
  }

  private exportPdfStandard(): void {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const tableWidth = pageWidth - (margin * 2);
    
    // Set font and size
    doc.setFont('helvetica');
    doc.setFontSize(12);

    // Add header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(this.translate.instant('peu.export.title'), margin, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`${this.translate.instant('peu.export.total_items')}: ${this.items.length}`, margin, 50);

    // Prepare table data - use empty string for checkbox column, we'll draw it manually
    const tableData = this.items.map((item) => [
      this.getItemLanguageField(item, 'category') || '',
      this.getItemLanguageField(item, 'domain') || '',
      this.getItemLanguageField(item, 'name') || '',
      this.getItemLanguageField(item, 'description') || '',
      this.getItemLanguageField(item, 'comentaire') || '',
      '', // Empty string for checkbox - will be drawn manually
    ]);

    // Get translated headers
    const headers = [
      this.translate.instant('peu.export.category'),
      this.translate.instant('peu.export.domain'),
      this.translate.instant('peu.export.item_name'),
      this.translate.instant('peu.export.description'),
      this.translate.instant('peu.export.comments'),
      this.translate.instant('peu.export.done')
    ];

    // Calculate column widths as percentages of available width
    // Category: 12%, Domain: 12%, Name: 18%, Description: 30%, Comments: 20%, Done: 8%
    const colWidths = [
      tableWidth * 0.12,  // Category
      tableWidth * 0.12,  // Domain
      tableWidth * 0.18,  // Item Name
      tableWidth * 0.30,  // Description
      tableWidth * 0.20,  // Comments
      tableWidth * 0.08   // Done
    ];

    // Apply autoTable with full width and custom checkbox drawing
    autoTable(doc, {
      startY: 60,
      head: [headers],
      body: tableData,
      theme: 'striped',
      margin: { 
        top: 60, 
        right: margin, 
        bottom: margin, 
        left: margin 
      },
      headStyles: { 
        fillColor: [99, 102, 241],
        font: 'helvetica',
        fontStyle: 'bold',
        fontSize: 10,
        textColor: 255,
        halign: 'left'
      },
      bodyStyles: {
        font: 'helvetica',
        fontSize: 8,
        halign: 'left',
        valign: 'top'
      },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 4,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      columnStyles: {
        0: { cellWidth: colWidths[0], halign: 'left' },
        1: { cellWidth: colWidths[1], halign: 'left' },
        2: { cellWidth: colWidths[2], halign: 'left' },
        3: { cellWidth: colWidths[3], halign: 'left' },
        4: { cellWidth: colWidths[4], halign: 'left' },
        5: { cellWidth: colWidths[5], halign: 'center' }
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      didDrawCell: (data: any) => {
        // Draw checkbox in the "Done" column (column index 5) for body rows only
        // data.section === 'body' ensures we're not drawing in the header
        if (data.column.index === 5 && data.section === 'body' && data.row.index >= 0) {
          const item = this.items[data.row.index];
          if (item) {
            const checkboxSize = 10;
            const x = data.cell.x + (data.cell.width / 2) - (checkboxSize / 2);
            const y = data.cell.y + (data.cell.height / 2) - (checkboxSize / 2);
            
            // Draw checkbox border (square)
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.rect(x, y, checkboxSize, checkboxSize);
            
            // If item is done, draw a checkmark
            if (item.done) {
              doc.setDrawColor(0, 128, 0);
              doc.setLineWidth(1.5);
              // Draw checkmark (two lines forming a check: bottom-left to middle, then middle to top-right)
              const checkX1 = x + checkboxSize * 0.25;
              const checkY1 = y + checkboxSize * 0.55;
              const checkX2 = x + checkboxSize * 0.45;
              const checkY2 = y + checkboxSize * 0.75;
              const checkX3 = x + checkboxSize * 0.75;
              const checkY3 = y + checkboxSize * 0.3;
              
              doc.line(checkX1, checkY1, checkX2, checkY2);
              doc.line(checkX2, checkY2, checkX3, checkY3);
            }
          }
        }
      }
    });

    doc.save('peu_items_' + new Date().getTime() + '.pdf');
  }

  private exportPdfArabic(): void {
    // For Arabic text, we'll use an HTML-based approach
    // This handles Arabic text much better than jsPDF
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
      link.download = 'peu_items_' + new Date().getTime() + '.html';
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  private generateArabicHtml(): string {
    const isArabic = this.currentLanguage === 'ar';
    const title = this.translate.instant('peu.export.title');
    const totalItems = this.translate.instant('peu.export.total_items');
    const categoryLabel = this.translate.instant('peu.export.category');
    const domainLabel = this.translate.instant('peu.export.domain');
    const itemNameLabel = this.translate.instant('peu.export.item_name');
    const descriptionLabel = this.translate.instant('peu.export.description');
    const commentsLabel = this.translate.instant('peu.export.comments');
    const doneLabel = this.translate.instant('peu.export.done');
    const doneText = isArabic ? 'نعم' : 'Yes';
    const notDoneText = isArabic ? 'لا' : 'No';

    let html = `
      <!DOCTYPE html>
      <html dir="${isArabic ? 'rtl' : 'ltr'}" lang="${this.currentLanguage}">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { 
            font-family: 'Arial', 'Tahoma', sans-serif; 
            margin: 20px; 
            direction: ${isArabic ? 'rtl' : 'ltr'};
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #6366f1;
            padding-bottom: 15px;
          }
          .header h1 {
            color: #6366f1;
            margin: 0;
          }
          .info { 
            margin-bottom: 20px; 
            font-size: 14px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
            font-size: 12px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 10px; 
            text-align: ${isArabic ? 'right' : 'left'}; 
          }
          th { 
            background-color: #6366f1; 
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f5f7fa;
          }
          .checkbox-cell {
            text-align: center;
          }
          .checkbox {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #333;
            border-radius: 3px;
            position: relative;
            vertical-align: middle;
          }
          .checkbox.checked::after {
            content: '✓';
            position: absolute;
            top: -2px;
            left: 2px;
            color: green;
            font-weight: bold;
          }
          @media print {
            body { margin: 0; }
            .header { page-break-after: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>${totalItems}: ${this.items.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>${categoryLabel}</th>
              <th>${domainLabel}</th>
              <th>${itemNameLabel}</th>
              <th>${descriptionLabel}</th>
              <th>${commentsLabel}</th>
              <th class="checkbox-cell">${doneLabel}</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    this.items.forEach(item => {
      const category = this.getItemLanguageField(item, 'category');
      const domain = this.getItemLanguageField(item, 'domain');
      const itemName = this.getItemLanguageField(item, 'name');
      const description = this.getItemLanguageField(item, 'description');
      const comments = this.getItemLanguageField(item, 'comentaire') || '';
      const isDone = item.done;
      
      // Escape HTML to prevent XSS
      const escapeHtml = (text: string) => {
        if (!text) return '';
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };
      
      html += `
        <tr>
          <td>${escapeHtml(category)}</td>
          <td>${escapeHtml(domain)}</td>
          <td>${escapeHtml(itemName)}</td>
          <td>${escapeHtml(description)}</td>
          <td>${escapeHtml(comments)}</td>
          <td class="checkbox-cell">
            <span class="checkbox ${isDone ? 'checked' : ''}"></span>
          </td>
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
      } else if (fieldName === 'category') {
        return item.profile_category_name_ar || '';
      } else if (fieldName === 'domain') {
        return item.profile_domain_name_ar || '';
      }
    } else {
      // For French language, use non-_ar fields
      if (fieldName === 'name') {
        return item.name || '';
      } else if (fieldName === 'description') {
        return item.description || '';
      } else if (fieldName === 'comentaire') {
        return item.comentaire || '';
      } else if (fieldName === 'category') {
        return item.profile_category_name || '';
      } else if (fieldName === 'domain') {
        return item.profile_domain_name || '';
      }
    }
    return '';
  }

  getStatusLabel(etat: string): string {
    switch (etat) {
      case 'ACQUIS':
        return this.currentLanguage === 'ar' ? 'مكتسب' : 'Acquis';
      case 'NON_ACQUIS':
        return this.currentLanguage === 'ar' ? 'غير مكتسب' : 'Non Acquis';
      case 'PARTIEL':
        return this.currentLanguage === 'ar' ? 'جزئي' : 'Partiel';
      case 'NON_COTE':
        return this.currentLanguage === 'ar' ? 'غير مقيم' : 'Non Cote';
      default:
        return this.currentLanguage === 'ar' ? 'غير مقيم' : 'Non Cote';
    }
  }
}

