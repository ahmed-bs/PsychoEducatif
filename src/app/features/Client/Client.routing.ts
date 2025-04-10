import { Routes, RouterModule } from '@angular/router';
import { DashboardClientComponent } from './dashboardClient/dashboardClient.component';
import { ExploreComponent } from './explore/explore.component';
import { Kids_profilesComponent } from './kids_profiles/kids_profiles.component';
import { EvaluationsComponent } from './evaluations/evaluations.component';
import { QuizComponent } from './quiz/quiz.component';
import { CalendarComponent } from './calendar/calendar.component';

const routes: Routes = [
  { path:'',component:DashboardClientComponent },
  { path:'explore',component:ExploreComponent },
  { path:'calendar',component:CalendarComponent },
  { path:'Kids_profiles/:childId',component:Kids_profilesComponent },
  { path:'evaluations/:categorie',component:EvaluationsComponent },
  { path: 'evaluations_configurations', loadChildren: () => import('./evaluationConfig/evaluationConfig.module').then(m => m.EvaluationConfigModule) },
  { path: 'quiz/:categorie', component: QuizComponent },
];

export const ClientRoutes = RouterModule.forChild(routes);
