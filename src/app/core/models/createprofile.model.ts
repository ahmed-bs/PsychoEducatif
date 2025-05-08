export interface CreateProfileRequest {
    first_name: string;
    last_name: string;
    birth_date: string;
    gender?: 'M' | 'F' ;
    diagnosis?: string;
    notes?: string;
  }
  
  export interface UpdateProfileRequest {
    first_name?: string;
    last_name?: string;
    birth_date?: string;
    gender?: 'M' | 'F' ;
    diagnosis?: string;
    notes?: string;
    is_active?: boolean;
  }
  
  export interface ShareProfileRequest {
    shared_with: string;
    permissions: ('view' | 'edit' | 'share')[];
  }
  
  export interface ApiResponse<T> {
    message?: string;
    data?: T;
    error?: string;
  }