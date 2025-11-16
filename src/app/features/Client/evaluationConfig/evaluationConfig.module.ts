import { EvaluationConfigComponent } from './evaluationConfig.component';
import { NgModule } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
// import { ColumnFilterModule } from 'primeng/columnfilter';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { ToolbarModule } from 'primeng/toolbar';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CategoriesComponent } from './categories/categories.component';
import { ToastModule } from 'primeng/toast';
import { EvaluationConfigRoutes } from './evaluationConfig.routing';
import { ItemsComponent } from './items/items.component';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpLoaderFactory } from 'src/app/app.module';
@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    EvaluationConfigRoutes,
    NgClass,
    FormsModule,
    TableModule,
    InputTextModule,
    InputTextareaModule,
    IconFieldModule,
    InputIconModule,
    FormsModule,
    ProgressBarModule,
    DialogModule,
    ButtonModule,
    CalendarModule,
    ToolbarModule,
    DialogModule, 
    DropdownModule, 
    TooltipModule,
    InputSwitchModule,
    InputTextModule,
    ToastModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  declarations: [EvaluationConfigComponent,CategoriesComponent,ItemsComponent]
})
export class EvaluationConfigModule { }
