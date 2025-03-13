import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientComponent } from './Client.component';
import { DashboardClientComponent } from './dashboardClient/dashboardClient.component';
import { ClientRoutes } from './Client.routing';
import { ExploreComponent } from './explore/explore.component';
import { Kids_profilesComponent } from './kids_profiles/kids_profiles.component';

@NgModule({
  imports: [
    CommonModule,
    ClientRoutes,
    Kids_profilesComponent

  ],
  declarations: [ClientComponent,ExploreComponent
]
})
export class ClientModule { }
