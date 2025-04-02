import { EvaluationConfigComponent } from './evaluationConfig.component';
import { NgModule } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
// import { ColumnFilterModule } from 'primeng/columnfilter';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { ToolbarModule } from 'primeng/toolbar';
import { DropdownModule } from 'primeng/dropdown';
import { CategoriesComponent } from './categories/categories.component';
import { EvaluationConfigRoutes } from './evaluationConfig.routing';
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
    InputTextModule
  ],
  declarations: [EvaluationConfigComponent,CategoriesComponent]
})
export class EvaluationConfigModule { }
