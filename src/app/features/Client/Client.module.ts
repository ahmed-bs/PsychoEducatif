import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientComponent } from './Client.component';
import { DashboardClientComponent } from './dashboardClient/dashboardClient.component';
import { ClientRoutes } from './Client.routing';
import { ExploreComponent } from './explore/explore.component';
import { Kids_profilesComponent } from './kids_profiles/kids_profiles.component';
import { EvaluationsComponent } from './evaluations/evaluations.component';
import { ReplaceSpacesPipe } from 'src/app/shared/replace-spaces.pipe';

@NgModule({
  imports: [
    CommonModule,
    ClientRoutes,

  ],
  declarations: [ClientComponent,ExploreComponent,ReplaceSpacesPipe
]
})
export class ClientModule { }
