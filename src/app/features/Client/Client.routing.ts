import { Routes, RouterModule } from '@angular/router';
import { DashboardClientComponent } from './dashboardClient/dashboardClient.component';
import { ExploreComponent } from './explore/explore.component';
import { Kids_profilesComponent } from './kids_profiles/kids_profiles.component';

const routes: Routes = [
  { path:'',component:DashboardClientComponent },
  { path:'explore',component:ExploreComponent },
  { path:'Kids_profiles',component:Kids_profilesComponent },
];

export const ClientRoutes = RouterModule.forChild(routes);
