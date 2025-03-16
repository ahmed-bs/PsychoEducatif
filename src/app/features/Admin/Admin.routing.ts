import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardAdminComponent } from './dashboardAdmin/dashboardAdmin.component';
import { Gerer_EvaluationsComponent } from './gerer_Evaluations/gerer_Evaluations.component';

const routes: Routes = [
  { path: '', component: DashboardAdminComponent },
  { path: 'gerer_evalutations', component: Gerer_EvaluationsComponent },
  { path: 'users', loadChildren: () => import('./users/users.module').then(m => m.UsersModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutes { }
