import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './Home.component';
import { EvaluationComponent } from './Evaluation/Evaluation.component';
import { ObjectComponent } from './Object/Object.component';
import { StrategyComponent } from './Strategy/Strategy.component';
import { HomeRoutes } from './Home.routing';
import { AccueilComponent } from './Accueil/Accueil.component';
@NgModule({
  imports: [
    CommonModule,
    HomeRoutes,
   
  ],
  declarations: [HomeComponent,EvaluationComponent,ObjectComponent,StrategyComponent,AccueilComponent]
})
export class HomeModule { }
