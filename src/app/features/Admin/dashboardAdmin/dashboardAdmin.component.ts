import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddProfileComponent } from '../users/AddProfile/AddProfile.component';

@Component({
  selector: 'app-dashboardAdmin',
  templateUrl: './dashboardAdmin.component.html',
  styleUrls: ['./dashboardAdmin.component.css']
})
export class DashboardAdminComponent implements OnInit {

  constructor(public dialog: MatDialog) {}

  openDialog() {
    this.dialog.open(AddProfileComponent, {
      width: '700px',
      // height:'400px'
    });
  }

  ngOnInit() {
  }

}
