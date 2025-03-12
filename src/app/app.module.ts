import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
//material module
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
// primeng module 

//Components
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';
import { FooterComponent } from './shared/footer/footer.component';
import { NavbarHomeComponent } from './shared/navbar-home/navbar-home.component';
import { NavbarDashboardComponent } from './shared/navbar-dashboard/navbar-dashboard.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SidebarDashboardComponent } from './shared/sidebar-dashboard/sidebar-dashboard.component';
import { UserLayoutComponent } from './layouts/user-layout/user-layout.component';
import { SidebarClientComponent } from './shared/sidebar-client/sidebar-client.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarHomeComponent,
    PublicLayoutComponent,
    UserLayoutComponent,
    DashboardLayoutComponent,
    FooterComponent,
    SidebarDashboardComponent,
    SidebarClientComponent,
    NavbarDashboardComponent
  ],
  imports: [
    RouterModule,
    RouterLink,
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    BrowserAnimationsModule,
    //material
    MatToolbarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    //primeng


  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
