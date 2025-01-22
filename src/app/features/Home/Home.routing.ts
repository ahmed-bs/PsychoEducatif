import { Routes, RouterModule } from '@angular/router';
import { EvaluationComponent } from './Evaluation/Evaluation.component';
import { ObjectComponent } from './Object/Object.component';
import { StrategyComponent } from './Strategy/Strategy.component';
import { AccueilComponent } from './Accueil/Accueil.component';

const routes: Routes = [
  {
    path: '', component: AccueilComponent,
  },
  {
    path: 'evaluation', component: EvaluationComponent,
  },
  {
    path: 'object', component: ObjectComponent,
  },
  {
    path: 'strategy', component: StrategyComponent,
  },
  
];

export const HomeRoutes = RouterModule.forChild(routes);
