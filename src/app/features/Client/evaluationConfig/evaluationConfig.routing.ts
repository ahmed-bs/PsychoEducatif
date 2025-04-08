import { Routes, RouterModule } from '@angular/router';
import { CategoriesComponent } from './categories/categories.component';
import { ItemsComponent } from './items/items.component';

const routes: Routes = [
  { path: '', component: CategoriesComponent },
  { path: 'items', component: ItemsComponent },
];

export const EvaluationConfigRoutes = RouterModule.forChild(routes);
