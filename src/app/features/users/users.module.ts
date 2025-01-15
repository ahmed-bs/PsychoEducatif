import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersRoutingModule } from './users.routing';
import { HomeComponent } from './home/home.component';
import { HeaderComponent } from 'src/app/shared/header/header.component';


@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    UsersRoutingModule
  ]
})
export class UsersModule { }
