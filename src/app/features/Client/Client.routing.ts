import { Routes, RouterModule } from '@angular/router';
import { DashboardClientComponent } from './dashboardClient/dashboardClient.component';

const routes: Routes = [
  { path:'',component:DashboardClientComponent },
];

export const ClientRoutes = RouterModule.forChild(routes);
