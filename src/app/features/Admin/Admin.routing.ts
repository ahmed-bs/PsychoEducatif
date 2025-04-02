import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardAdminComponent } from './dashboardAdmin/dashboardAdmin.component';


const routes: Routes = [
  { path: '', component: DashboardAdminComponent },
  { path: 'evaluations_configurations', loadChildren: () => import('./evaluationConfig/evaluationConfig.module').then(m => m.EvaluationConfigModule) },
  { path: 'users', loadChildren: () => import('./users/users.module').then(m => m.UsersModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutes { }
