export class RegisterRequest {
    username: string;
    email: string;
    password: string;
    confirm_password?: string;
    bio?: string | null;
  
    userType: 'professional' | 'parent' | 'other';
    accepteConditions: boolean;

  
    constructor(
      
        email: string,
        username: string,
        userType: 'professional' | 'parent' | 'other',
        accepteConditions: boolean,password: string,
        confirm_password?: string,
        bio?: string 
      ) {
        this.email = email;
        this.username = username;
        this.userType = userType;
        this.password = password;
        this.confirm_password = confirm_password;
        this.accepteConditions = accepteConditions
        this.bio = bio;
      }
    
      isParent(): boolean {
        return this.userType === 'parent';
      }
    
      isProfessional(): boolean {
        return this.userType === 'professional';
      }
    



  }
  