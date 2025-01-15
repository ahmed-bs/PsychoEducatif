import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersRoutingModule } from './users.routing';
import { HomeComponent } from './home/home.component';
import { HeaderComponent } from 'src/app/shared/header/header.component';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [HomeComponent,HeaderComponent],
  imports: [
    CommonModule,
    UsersRoutingModule,
    RouterModule
  ]
})
export class UsersModule { }
