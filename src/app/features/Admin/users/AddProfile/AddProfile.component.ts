import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
@Component({
  standalone: true,
  selector: 'app-AddProfile',
  templateUrl: './AddProfile.component.html',
  styleUrls: ['./AddProfile.component.css'],
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule, 
    MatInputModule  ,
    MatIconModule,
    MatSelectModule 

  ]
})
export class AddProfileComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<AddProfileComponent>) {}

  closeDialog() {
    this.dialogRef.close();
  }
  ngOnInit() {
  }
  

}


