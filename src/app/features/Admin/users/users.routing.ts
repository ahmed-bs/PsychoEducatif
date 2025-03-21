import { Routes, RouterModule } from '@angular/router';
import { Users_listComponent } from './users_list/users_list.component';
import { Profiles_listComponent } from './profiles_list/profiles_list.component';
import { AddProfileComponent } from './AddProfile/AddProfile.component';

const routes: Routes = [
  { path: 'list_users', component: Users_listComponent },
  { path: 'list_profiles', component: Profiles_listComponent },
];


export const UsersRoutes = RouterModule.forChild(routes);
