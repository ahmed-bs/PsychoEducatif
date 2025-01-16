import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientComponent } from './Client.component';
import { DashboardClientComponent } from './dashboardClient/dashboardClient.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [ClientComponent,DashboardClientComponent]
})
export class ClientModule { }
