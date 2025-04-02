import { Routes, RouterModule } from '@angular/router';
import { CategoriesComponent } from './categories/categories.component';

const routes: Routes = [
  { path: '', component: CategoriesComponent },
];

export const EvaluationConfigRoutes = RouterModule.forChild(routes);
