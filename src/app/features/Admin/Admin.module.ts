import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminComponent } from './Admin.component';
import { AdminRoutes } from './Admin.routing';
import { DashboardAdminComponent } from './dashboardAdmin/dashboardAdmin.component';
import { UsersComponent } from './users/users.component';

@NgModule({
  imports: [
    CommonModule,AdminRoutes
  ],
  declarations: [AdminComponent,DashboardAdminComponent]
})
export class AdminModule { }
