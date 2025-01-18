import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientComponent } from './Client.component';
import { DashboardClientComponent } from './dashboardClient/dashboardClient.component';
import { ClientRoutes } from './Client.routing';

@NgModule({
  imports: [
    CommonModule,
    ClientRoutes,
  ],
  declarations: [ClientComponent,DashboardClientComponent]
})
export class ClientModule { }
