import { Routes, RouterModule } from '@angular/router';
import { DashboardClientComponent } from './dashboardClient/dashboardClient.component';
import { ExploreComponent } from './explore/explore.component';
import { EvaluationsComponent } from './evaluations/evaluations.component';
import { QuizComponent } from './quiz/quiz.component';
import { CalendarComponent } from './calendar/calendar.component';
import { PickProfileComponent } from 'src/app/shared/pick_profile/pick_profile.component';
import { Child_profileComponent } from './Child_profile/Child_profile.component';
import { PeuComponent } from './peu/peu.component';



const routes: Routes = [

  { path:'explore',component:ExploreComponent },
  { path:'calendar/:childId',component:CalendarComponent },
  { path:'Kids_profiles/:childId',component:PickProfileComponent },
  { path:'profiles/:childId',component:Child_profileComponent },
  { path:'evaluations/:domainId',component:EvaluationsComponent },
  { path: 'evaluations_configurations', loadChildren: () => import('./evaluationConfig/evaluationConfig.module').then(m => m.EvaluationConfigModule) },
  { path: 'summary/:childId', loadChildren: () => import('./summary/summary.module').then(m => m.SummaryModule) },
  { path: 'quiz/:domainId', component: QuizComponent },
  { path: 'peu/:childId', component: PeuComponent },
  { path:':childId',component:DashboardClientComponent },
];

export const ClientRoutes = RouterModule.forChild(routes);
