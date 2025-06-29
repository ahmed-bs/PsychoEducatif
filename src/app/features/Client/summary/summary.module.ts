import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SummaryComponent } from './summary.component';

const routes: Routes = [
  { path: '', component: SummaryComponent }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    RouterModule.forChild(routes),
    SummaryComponent
  ]
})
export class SummaryModule { } 