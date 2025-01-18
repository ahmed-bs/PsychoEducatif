import { Routes, RouterModule } from '@angular/router';
import { DashboardAdminComponent } from './dashboardAdmin/dashboardAdmin.component';

const routes: Routes = [
  { path : '', component : DashboardAdminComponent },
];

export const AdminRoutes = RouterModule.forChild(routes);
