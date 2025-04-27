export class ProfileShare {
    id?: number;
    profile!: number; // Profile ID
    shared_with!: number; // Profile ID
    can_read!: boolean;
    can_write!: boolean;
    can_update!: boolean;
    can_delete!: boolean;
  }