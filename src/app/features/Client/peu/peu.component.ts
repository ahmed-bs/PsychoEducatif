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
          this.error = 'No profile selected';
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
      this.error = 'No profile ID available';
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
        this.error = 'Failed to load items';
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
      const exportData = this.items.map((item) => ({
        'Category': this.getItemLanguageField(item, 'category'),
        'Domain': this.getItemLanguageField(item, 'domain'),
        'Item Name': this.getItemLanguageField(item, 'name'),
        'Description': this.getItemLanguageField(item, 'description'),
        'Comments': this.getItemLanguageField(item, 'comentaire') || '',
        'Done': item.done ? 'OK' : '',
      }));

      const worksheet = xlsx.utils.json_to_sheet(exportData);
      const workbook = { Sheets: { 'PEU Items': worksheet }, SheetNames: ['PEU Items'] };
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
    doc.text('PEU - Profile Items', margin, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Items: ${this.items.length}`, margin, 50);

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
    const headers = this.currentLanguage === 'ar' 
      ? ['الفئة', 'المجال', 'اسم العنصر', 'الوصف', 'التعليقات', 'منجز']
      : ['Category', 'Domain', 'Item Name', 'Description', 'Comments', 'Done'];

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

  getItemLanguageField(item: ProfileItem, fieldName: string): string {
    if (this.currentLanguage === 'ar') {
      if (fieldName === 'name') {
        return item.name_ar || item.name || '';
      } else if (fieldName === 'description') {
        return item.description_ar || item.description || '';
      } else if (fieldName === 'comentaire') {
        return item.commentaire_ar || item.comentaire || '';
      } else if (fieldName === 'category') {
        return item.profile_category_name_ar || item.profile_category_name || '';
      } else if (fieldName === 'domain') {
        return item.profile_domain_name_ar || item.profile_domain_name || '';
      }
    } else {
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

