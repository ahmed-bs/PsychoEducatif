import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersComponent } from './users.component';
import { Users_listComponent } from './users_list/users_list.component';
import { UsersRoutes } from './users.routing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  imports: [
    CommonModule,UsersRoutes,MatDialogModule,MatButtonModule
  ],
  declarations: [UsersComponent]
})
export class UsersModule { }
