import { Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-profiles_list',
  templateUrl: './profiles_list.component.html',
  styleUrls: ['./profiles_list.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class Profiles_listComponent implements OnInit {
onAddNew() {
throw new Error('Method not implemented.');
}
onShare(user: string) {
  console.log('User:', user);
  this.showPopup = true;
}
  users: any[] = [];
  loading: boolean = true;
  showFilters: boolean = false;
  showPopup = false;
  userFilter = '';
  selectedAccess: any;
  
  accessOptions = [
    { label: 'Lecture seule', value: 'lecture' },
    { label: 'Ecriture', value: 'ecriture' },
    { label: 'All', value: 'all' }
  ];
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  onEdit(user: any) {
    console.log('Editing user:', user);
    // Open a modal or navigate to edit form
  }
  
  onDelete(user: any) {
    console.log('Deleting user:', user);
    // Show confirmation dialog and remove from array if confirmed
  }
  
  displayAddUserDialog: boolean = false;

  newUser: { id: number | null; name: string; age: number | null; birthDate: Date | null; diagnostic: string; progress: number | null; imageUrl: string } = {
    id: null,
    name: '',
    age: null,
    birthDate: null,
    diagnostic: '',
    progress: null,
    imageUrl: ''
  };

  // Open the Add User Dialog
  showAddUserDialog() {
    this.displayAddUserDialog = true;
  }
  addUser() {
    const newId = Math.floor(Math.random() * 1000); // Simulating user id generation
    this.newUser.id = newId;
    
    // Add the new user to your user list (you can replace this with an actual data service call)
    console.log('New User Added:', this.newUser);

    // Reset form fields and close dialog
    this.newUser = {
      id: null,
      name: '',
      age: null,
      birthDate: null,
      diagnostic: '',
      progress: null,
      imageUrl: ''
    };
    this.displayAddUserDialog = false;
  }
  
  ngOnInit() {
    this.users = [
      {
        id: 1,
        name: 'John Doe',
        age: 28,
        birthDate: new Date('1996-03-15'),
        diagnostic: 'Trouble de la concentration',
        progress: 70,
        imageUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
      },
      {
        id: 2,
        name: 'Jane Smith',
        age: 35,
        birthDate: new Date('1989-05-22'),
        diagnostic: 'Anxiété généralisée',
        progress: 55,
        imageUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
      },
      {
        id: 3,
        name: 'Ahmed Ali',
        age: 22,
        birthDate: new Date('2002-11-10'),
        diagnostic: 'Trouble du langage',
        progress: 40,
        imageUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
      },
      {
        id: 4,
        name: 'Marie Curie',
        age: 30,
        birthDate: new Date('1994-01-09'),
        diagnostic: 'Autisme léger',
        progress: 65,
        imageUrl: 'https://randomuser.me/api/portraits/women/4.jpg',
      },
      {
        id: 5,
        name: 'Luca Rossi',
        age: 26,
        birthDate: new Date('1998-07-03'),
        diagnostic: 'Hyperactivité',
        progress: 50,
        imageUrl: 'https://randomuser.me/api/portraits/men/5.jpg',
      },
      {
        id: 6,
        name: 'Anna Müller',
        age: 29,
        birthDate: new Date('1995-09-14'),
        diagnostic: 'Trouble du sommeil',
        progress: 60,
        imageUrl: 'https://randomuser.me/api/portraits/women/6.jpg',
      },
      {
        id: 7,
        name: 'Carlos Diaz',
        age: 33,
        birthDate: new Date('1991-06-11'),
        diagnostic: 'Phobie sociale',
        progress: 45,
        imageUrl: 'https://randomuser.me/api/portraits/men/7.jpg',
      },
      {
        id: 8,
        name: 'Sofia Petrova',
        age: 25,
        birthDate: new Date('1999-02-19'),
        diagnostic: 'Anxiété et stress',
        progress: 75,
        imageUrl: 'https://randomuser.me/api/portraits/women/8.jpg',
      },
      {
        id: 9,
        name: 'Ali Hassan',
        age: 31,
        birthDate: new Date('1993-08-25'),
        diagnostic: 'Déficit d’attention',
        progress: 68,
        imageUrl: 'https://randomuser.me/api/portraits/men/9.jpg',
      },
      {
        id: 10,
        name: 'Emily Chen',
        age: 27,
        birthDate: new Date('1997-12-30'),
        diagnostic: 'Trouble du comportement',
        progress: 80,
        imageUrl: 'https://randomuser.me/api/portraits/women/10.jpg',
      }
    ];
    this.loading = false;
  }

}