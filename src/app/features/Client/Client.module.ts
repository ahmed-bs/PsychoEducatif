import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientComponent } from './Client.component';
import { DashboardClientComponent } from './dashboardClient/dashboardClient.component';
import { ClientRoutes } from './Client.routing';
import { ExploreComponent } from './explore/explore.component';
import { ReplaceSpacesPipe } from 'src/app/shared/replace-spaces.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { Add_popupComponent } from './Child_profile/add_popup/add_popup.component';
import { AppModule, HttpLoaderFactory } from "../../app.module";
import { ProgressBarComponent } from 'src/app/shared/progress-bar/progress-bar.component';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
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
    InputGroupModule,
    InputGroupAddonModule,
    ClientRoutes,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
],
  declarations: [ClientComponent,Add_popupComponent,ExploreComponent,ReplaceSpacesPipe,ProgressBarComponent 
],
  exports: [ProgressBarComponent]
})
export class ClientModule { }
