import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Correct import

@NgModule({
  declarations: [
    AppComponent,
    FooterComponent, // Declare only components, directives, and pipes
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    RouterModule 
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
