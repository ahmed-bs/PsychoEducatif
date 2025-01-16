import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';

const routes: Routes = [

  {
    path: '', component: LayoutComponent,
    children: [
      { path: 'home', loadChildren: () => import('./features/Client/Client.module').then(m => m.ClientModule) },

    ]
  },

]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
