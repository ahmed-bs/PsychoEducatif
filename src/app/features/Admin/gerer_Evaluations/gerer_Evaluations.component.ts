import { Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-gerer-evaluations',
  templateUrl: './gerer_Evaluations.component.html',
  styleUrls: ['./gerer_Evaluations.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class Gerer_EvaluationsComponent implements OnInit {
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