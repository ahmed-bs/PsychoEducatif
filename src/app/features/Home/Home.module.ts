import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './Home.component';
import { EvaluationComponent } from './Evaluation/Evaluation.component';
import { ObjectComponent } from './Object/Object.component';
import { StrategyComponent } from './Strategy/Strategy.component';
import { HomeRoutes } from './Home.routing';
import { AccueilComponent } from './Accueil/Accueil.component';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpLoaderFactory } from 'src/app/app.module';
@NgModule({
  imports: [
    CommonModule,
    HomeRoutes,
       TranslateModule.forRoot({
         loader: {
           provide: TranslateLoader,
           useFactory: HttpLoaderFactory,
           deps: [HttpClient]
         }
       })
  ],
  declarations: [HomeComponent,EvaluationComponent,ObjectComponent,StrategyComponent,AccueilComponent]
})
export class HomeModule { }
