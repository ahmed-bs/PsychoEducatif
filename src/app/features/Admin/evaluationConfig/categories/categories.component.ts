import { Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class CategoriesComponent implements OnInit {

  showFilters: boolean = false;
  displayAddUserDialog: boolean = false;
  constructor() { }

   insights: Insight[] = [
    {
      categoryIcon: "category",
      title: "LA COMMUNICATION",
      createdDate: "17/01/2025",
      itemsCount: 215,
      domainsCount: 15,
    },
    {
      categoryIcon: "category",
      title: "LA COMMUNICATION",
      createdDate: "17/01/2025",
      itemsCount: 215,
      domainsCount: 15,
    },
    {
      categoryIcon: "category",
      title: "LA COMMUNICATION",
      createdDate: "17/01/2025",
      itemsCount: 215,
      domainsCount: 15,
    },
    {
      categoryIcon: "category",
      title: "LA COMMUNICATION",
      createdDate: "17/01/2025",
      itemsCount: 215,
      domainsCount: 15,
    },
    {
      categoryIcon: "category",
      title: "LA COMMUNICATION",
      createdDate: "17/01/2025",
      itemsCount: 215,
      domainsCount: 15,
    },
    {
      categoryIcon: "category",
      title: "LA COMMUNICATION",
      createdDate: "17/01/2025",
      itemsCount: 215,
      domainsCount: 15,
    },
    {
      categoryIcon: "category",
      title: "LA COMMUNICATION",
      createdDate: "17/01/2025",
      itemsCount: 215,
      domainsCount: 15,
    },
  ];

  viewDetails(item: { title: string; description: string }) {
    console.log('Détails de l\'élément:', item);
  }
  ngOnInit() {
  }
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  showAddUserDialog() {
    this.displayAddUserDialog = true;
  }
}
interface Insight {
  categoryIcon: string;
  title: string;
  createdDate: string;
  itemsCount: number;
  domainsCount: number;
}