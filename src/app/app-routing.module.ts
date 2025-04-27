import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';
import { UserLayoutComponent } from './layouts/user-layout/user-layout.component';
import { PickProfileComponent } from './shared/pick_profile/pick_profile.component';


const routes: Routes = [
  {
    path: '', component: PublicLayoutComponent, children: [
      { path: '', loadChildren: () => import('./features/Home/Home.module').then(m => m.HomeModule) },
    ]
  },
  {
    path: 'pick_profileComponent', component: PickProfileComponent
  },
  {
    path: 'Dashboard-client', component: UserLayoutComponent, children: [
      { path: 'client', loadChildren: () => import('./features/Client/Client.module').then(m => m.ClientModule) },
    ]
  },
  {
    path: 'Dashboard', component: DashboardLayoutComponent, children: [ 
      { path: 'admin', loadChildren: () => import('./features/Admin/Admin.module').then(m => m.AdminModule) },
    ]
  },
  { path: 'auth', loadChildren: () => import('./features/Auth/Auth.module').then(m => m.AuthModule) }
  ,
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
