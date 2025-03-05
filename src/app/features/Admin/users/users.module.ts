import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersComponent } from './users.component';
import { Users_listComponent } from './users_list/users_list.component';
import { UsersRoutes } from './users.routing';

@NgModule({
  imports: [
    CommonModule,UsersRoutes
  ],
  declarations: [UsersComponent]
})
export class UsersModule { }
