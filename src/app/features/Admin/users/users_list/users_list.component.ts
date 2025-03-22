import { Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-users_list',
  templateUrl: './users_list.component.html',
  styleUrls: ['./users_list.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class Users_listComponent implements OnInit {
addNewUser() {
throw new Error('Method not implemented.');
}
  users: any[] = [];
  loading: boolean = true;
  showFilters: boolean = false;
  displayAddUserDialog = false;

  newUser = {
    username: '',
    address: '',
    phone: '',
    email: '',
    registerDate: new Date(),
    profilesNumber: 1
  };
  showAddUserDialog() {
    // this.newUser = { username: '', address: '', phone: '', email: '', registerDate: new Date(), profilesNumber: 1 };
    this.displayAddUserDialog = true;
  }

  addUser() {
    if (this.newUser.username && this.newUser.email) {
      const newUserEntry = { ...this.newUser, id: this.users.length + 1, imageUrl: 'https://via.placeholder.com/50' };
      this.users.push(newUserEntry);
      this.displayAddUserDialog = false;
    }
  }
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  editUser(user: any) {
    // Add your edit logic here (navigate to edit page or open dialog)
    console.log('Edit user:', user);
  }
  
  deleteUser(id: number) {
    // Add your delete logic here (confirmation and delete)
    console.log('Delete user with ID:', id);
  }
  
  
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
        imageUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
      },
      {
        id: 2,
        username: 'Jane Smith',
        address: '456 Park Ave, London',
        phone: '+44 20 7946 0958',
        email: 'jane.smith@example.com',
        registerDate: new Date('2022-11-05'),
        profilesNumber: 5,
        imageUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
      },
      {
        id: 3,
        username: 'Ahmed Ali',
        address: 'Avenue Habib Bourguiba, Tunis',
        phone: '+216 55 000 000',
        email: 'ahmed.ali@example.com',
        registerDate: new Date('2024-02-20'),
        profilesNumber: 2,
        imageUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
      },
      {
        id: 4,
        username: 'Marie Curie',
        address: '25 Rue Saint-Honoré, Paris',
        phone: '+33 1 2345 6789',
        email: 'marie.curie@example.com',
        registerDate: new Date('2023-07-19'),
        profilesNumber: 4,
        imageUrl: 'https://randomuser.me/api/portraits/women/4.jpg',
      },
      {
        id: 5,
        username: 'Luca Rossi',
        address: 'Via Roma 101, Milan',
        phone: '+39 02 5555 6666',
        email: 'luca.rossi@example.com',
        registerDate: new Date('2023-09-03'),
        profilesNumber: 1,
        imageUrl: 'https://randomuser.me/api/portraits/men/5.jpg',
      },
      {
        id: 6,
        username: 'Anna Müller',
        address: 'Berliner Straße 10, Berlin',
        phone: '+49 30 1234567',
        email: 'anna.mueller@example.com',
        registerDate: new Date('2022-12-15'),
        profilesNumber: 6,
        imageUrl: 'https://randomuser.me/api/portraits/women/6.jpg',
      },
      {
        id: 7,
        username: 'Carlos Diaz',
        address: 'Gran Via, Madrid',
        phone: '+34 91 123 4567',
        email: 'carlos.diaz@example.com',
        registerDate: new Date('2024-01-01'),
        profilesNumber: 2,
        imageUrl: 'https://randomuser.me/api/portraits/men/7.jpg',
      },
      {
        id: 8,
        username: 'Sofia Petrova',
        address: 'Nevsky Prospekt, St. Petersburg',
        phone: '+7 812 123 4567',
        email: 'sofia.petrova@example.com',
        registerDate: new Date('2023-05-25'),
        profilesNumber: 3,
        imageUrl: 'https://randomuser.me/api/portraits/women/8.jpg',
      },
      {
        id: 9,
        username: 'Ali Hassan',
        address: 'King Fahd Road, Riyadh',
        phone: '+966 11 123 4567',
        email: 'ali.hassan@example.com',
        registerDate: new Date('2024-02-10'),
        profilesNumber: 5,
        imageUrl: 'https://randomuser.me/api/portraits/men/9.jpg',
      },
      {
        id: 10,
        username: 'Emily Chen',
        address: 'Orchard Road, Singapore',
        phone: '+65 1234 5678',
        email: 'emily.chen@example.com',
        registerDate: new Date('2023-08-30'),
        profilesNumber: 4,
        imageUrl: 'https://randomuser.me/api/portraits/women/10.jpg',
      }
    ];
    
    this.loading = false;
  }

}