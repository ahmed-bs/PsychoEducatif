import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
//components
import { AuthComponent } from './Auth.component';
import { SigninComponent } from './signin/signin.component';
import { SignupComponent } from './signup/signup.component';
//material 
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { AuthRoutes } from './Auth.routing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpLoaderFactory } from 'src/app/app.module';




@NgModule({
  imports: [
    CommonModule,
    AuthRoutes,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    //material
    MatToolbarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    //primeng
    InputGroupModule ,
    InputGroupAddonModule,
       TranslateModule.forRoot({
         loader: {
           provide: TranslateLoader,
           useFactory: HttpLoaderFactory,
           deps: [HttpClient]
         }
       })
  ],
  declarations: [AuthComponent, SigninComponent, SignupComponent]
})
export class AuthModule { }
