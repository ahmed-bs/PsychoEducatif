import { NgModule } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { UsersComponent } from './users.component';
import { Users_listComponent } from './users_list/users_list.component';
import { UsersRoutes } from './users.routing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
// import { ColumnFilterModule } from 'primeng/columnfilter';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@NgModule({
  imports: [
    CommonModule,
    UsersRoutes,
    MatDialogModule,
    MatButtonModule,
    NgClass,
    FormsModule,
    TableModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    FormsModule,
  ],
  declarations: [UsersComponent,Users_listComponent]
})
export class UsersModule { }
