import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class CategoriesComponent implements OnInit {
  displayAddUserDialog!: boolean;


  showFilters: boolean = false;
  constructor(private router: Router) { }

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
  topRightAction(_t23: Insight) {
    throw new Error('Method not implemented.');
    }
    editcontent(insight: any) {
      this.router.navigate(['Dashboard/admin/evaluations_configurations/items']); 
    }
    deleteInsight(_t23: Insight) {
    throw new Error('Method not implemented.');
    }
}
interface Insight {
  categoryIcon: string;
  title: string;
  createdDate: string;
  itemsCount: number;
  domainsCount: number;
}