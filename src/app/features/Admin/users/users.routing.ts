import { Routes, RouterModule } from '@angular/router';
import { Users_listComponent } from './users_list/users_list.component';

const routes: Routes = [
  { path: '', component: Users_listComponent },
];


export const UsersRoutes = RouterModule.forChild(routes);
