import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';
import { SigninComponent } from './shared/signin/signin.component';
import { SignupComponent } from './shared/signup/signup.component';

const routes: Routes = [

  {
    path: '', component: LayoutComponent,
    children: [
      { path: 'home', loadChildren: () => import('./features/Client/Client.module').then(m => m.ClientModule) },

    ]
  },
  {path:'signin',component:SigninComponent},
  {path:'signup',component:SignupComponent}

]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
