import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pick_profile',
  templateUrl: './pick_profile.component.html',
  styleUrls: ['./pick_profile.component.css']
})
export class Pick_profileComponent implements OnInit {


  ngOnInit() {
  }
  constructor(private router: Router) {}

  navigateToClient() {
    this.router.navigate(['/Dashboard-client/client']);
  }
}
