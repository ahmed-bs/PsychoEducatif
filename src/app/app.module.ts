import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router'; // Correct import
import { LayoutComponent } from './shared/layout/layout.component';
import { ClientModule } from './features/Client/Client.module';
import { FormsModule } from '@angular/forms';
import { SigninComponent } from './shared/signin/signin.component';
import { SignupComponent } from './shared/signup/signup.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    LayoutComponent,
    FooterComponent,
    SigninComponent,
    SignupComponent
  ],
  imports: [
    RouterModule ,
    RouterLink,
    FormsModule,
    MatIconModule,
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatFormFieldModule,
     MatInputModule,
     MatCheckboxModule,
   
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
