import { Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-users_list',
  templateUrl: './users_list.component.html',
  styleUrls: ['./users_list.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class Users_listComponent implements OnInit {
  users: any[] = [];
  loading: boolean = true;

  ngOnInit() {
    // Example data
    this.users = [
      {
        id: 1,
        username: 'John Doe',
        address: '123 Main St, New York',
        phone: '+1 123-456-7890',
        email: 'john.doe@example.com',
        registerDate: new Date('2023-01-12'),
        profilesNumber: 3,
      },
      {
        id: 2,
        username: 'Jane Smith',
        address: '456 Park Ave, London',
        phone: '+44 20 7946 0958',
        email: 'jane.smith@example.com',
        registerDate: new Date('2022-11-05'),
        profilesNumber: 5,
      },
      {
        id: 3,
        username: 'Ahmed Ali',
        address: 'Avenue Habib Bourguiba, Tunis',
        phone: '+216 55 000 000',
        email: 'ahmed.ali@example.com',
        registerDate: new Date('2024-02-20'),
        profilesNumber: 2,
      },
    ];
    this.loading = false;
  }

}