import { Routes, RouterModule } from '@angular/router';
import { DashboardClientComponent } from './dashboardClient/dashboardClient.component';
import { ExploreComponent } from './explore/explore.component';
import { Kids_profilesComponent } from './kids_profiles/kids_profiles.component';
import { EvaluationsComponent } from './evaluations/evaluations.component';
import { QuizComponent } from './quiz/quiz.component';

const routes: Routes = [
  { path:'',component:DashboardClientComponent },
  { path:'explore',component:ExploreComponent },
  { path:'Kids_profiles/:childId',component:Kids_profilesComponent },
  { path:'evaluations/:categorie',component:EvaluationsComponent },
  { path: 'quiz/:categorie', component: QuizComponent },
];

export const ClientRoutes = RouterModule.forChild(routes);
