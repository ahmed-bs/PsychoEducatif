import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

type ItemStatus = 'NON_COTE' | 'ACQUIS' | 'EN_COURS' | 'NON_ACQUIS';

interface Item {
  id: number;
  description: string;
  status: ItemStatus;
  domainId: number;
}

interface Domain {
  id: number;
  title: string;
  description: string;
  code: string;
  items: Item[];
  expanded?: boolean;
}

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css']
})
export class ItemsComponent implements OnInit {
  domaines: Domain[] = [];
  loading: boolean = true;
  itemForm: FormGroup;
  
  statusOptions = [
    { label: 'Non coté', value: 'NON_COTE' as ItemStatus },
    { label: 'Acquis', value: 'ACQUIS' as ItemStatus },
    { label: 'En cours', value: 'EN_COURS' as ItemStatus },
    { label: 'Non acquis', value: 'NON_ACQUIS' as ItemStatus }
  ];

  constructor(
    private location: Location,
    private fb: FormBuilder
  ) {
    this.itemForm = this.fb.group({
      domainId: ['', Validators.required],
      description: ['', Validators.required],
      status: ['NON_COTE', Validators.required]
    });
  }

  ngOnInit() {
    this.domaines = [
      {
        id: 1,
        title: "Hygiène corporelle",
        description: 'Assurer l\'hygiène et le bien-être du corps',
        code: 'HYG-001',
        items: [
          { id: 1, description: "Se laver les mains", status: "ACQUIS", domainId: 1 },
          { id: 2, description: "Se brosser les dents", status: "EN_COURS", domainId: 1 }
        ]
      },
      {
        id: 2,
        title: "Propreté",
        description: 'Maintenir la propreté des lieux et des objets',
        code: 'PRO-002',
        items: [
          { id: 3, description: "Utiliser les toilettes", status: "ACQUIS", domainId: 2 },
          { id: 4, description: "Jeter les déchets", status: "NON_ACQUIS", domainId: 2 }
        ]
      }
    ];
    this.loading = false;
  }

  toggleDomain(domain: Domain) {
    domain.expanded = !domain.expanded;
  }

  onSubmit() {
    if (this.itemForm.valid) {
      const formValue = this.itemForm.value;
      const domain = this.domaines.find(d => d.id === formValue.domainId);
      
      if (domain) {
        const newItem: Item = {
          id: Math.max(0, ...domain.items.map(i => i.id)) + 1,
          description: formValue.description,
          status: formValue.status,
          domainId: formValue.domainId
        };
        
        domain.items.push(newItem);
        this.itemForm.reset({
          status: 'NON_COTE'
        });
      }
    }
  }

  editItem(item: Item) {
    const domain = this.domaines.find(d => d.id === item.domainId);
    if (domain) {
      this.itemForm.patchValue({
        domainId: item.domainId,
        description: item.description,
        status: item.status
      });
    }
  }

  deleteItem(item: Item) {
    const domain = this.domaines.find(d => d.id === item.domainId);
    if (domain) {
      domain.items = domain.items.filter(i => i.id !== item.id);
    }
  }

  getStatusLabel(status: ItemStatus): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  }

  goBack() {
    this.location.back();
  }
}
