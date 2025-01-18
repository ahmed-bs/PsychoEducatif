import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';


const routes: Routes = [
  {
    path: '', component: PublicLayoutComponent, children: [
      { path: '', loadChildren: () => import('./features/Home/Home.module').then(m => m.HomeModule) },
    ]
  },
  {
    path: '', component: DashboardLayoutComponent, children: [
      { path: 'client', loadChildren: () => import('./features/Client/Client.module').then(m => m.ClientModule) },
      { path: 'admin', loadChildren: () => import('./features/Admin/Admin.module').then(m => m.AdminModule) }
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
