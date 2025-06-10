import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProfileItemService } from 'src/app/core/services/ProfileItem.service';
import { ProfileItem } from 'src/app/core/models/ProfileItem';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Import autoTable explicitly

@Component({
  standalone: true,
  selector: 'app-evaluations',
  templateUrl: './evaluations.component.html',
  styleUrls: ['./evaluations.component.css'],
  imports: [CommonModule, FormsModule, TableModule, ButtonModule],
})
export class EvaluationsComponent implements OnInit {
  domainId: number | null = null;
  items: ProfileItem[] = [];
  profileCategoryName: string | null = null;
  profileDomainName: string | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private profileItemService: ProfileItemService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
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

  exportExcel(): void {
    import('xlsx').then((xlsx) => {
      const exportData = [
        { 'Category': this.profileCategoryName || 'Unknown Category' },
        { 'Domain': this.profileDomainName || 'Unknown Domain' },
        {},
        ...this.items.map((item) => ({
          'Items': item.description || item.name,
          'Statuts': item.etat === 'ACQUIS' ? 'Acquise' :
                     item.etat === 'NON_ACQUIS' ? 'Non acquise' :
                     item.etat === 'PARTIEL' ? 'Partielle' : 'Non évalué',
          'Commentaires': item.commentaire && item.commentaire !== item.name ? item.commentaire : '-',
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
    doc.text(`Category: ${this.profileCategoryName || 'Unknown Category'}`, 40, 20);
    doc.text(`Domain: ${this.profileDomainName || 'Unknown Domain'}`, 40, 40);

    // Apply autoTable to the jsPDF instance
    autoTable(doc, {
      startY: 60,
      head: [['Items', 'Statuts', 'Commentaires']],
      body: this.items.map((item) => [
        item.description || item.name,
        item.etat === 'ACQUIS' ? 'Acquise' :
        item.etat === 'NON_ACQUIS' ? 'Non acquise' :
        item.etat === 'PARTIEL' ? 'Partielle' : 'Non évalué',
        item.commentaire && item.commentaire !== item.name ? item.commentaire : '-',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [0, 123, 255] },
      margin: { top: 60 },
    });

    doc.save('evaluations.pdf');
  }
}