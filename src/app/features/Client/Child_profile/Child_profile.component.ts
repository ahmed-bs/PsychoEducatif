import { Component, OnInit } from '@angular/core';
import { PickProfileComponent } from "../../../shared/pick_profile/pick_profile.component";


@Component({
  selector: 'app-Child_profile',
  templateUrl: './Child_profile.component.html',
  styleUrls: ['./Child_profile.component.css'],
  standalone: true,
  imports: [PickProfileComponent],
})
export class Child_profileComponent implements OnInit {


  constructor(){
  }

  ngOnInit() {
  }

}