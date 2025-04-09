export interface User {
  id: string;
  email: string;
  username: string;
  userType: 'professional' | 'parent' | 'other';
  accepteConditions: boolean;
  resetToken: string | null;
  resetTokenExpiry: string | null;
  dateJoined: string;
  lastUpdated: string;
  securityQuestion: string;
  securityAnswer: string;
  bio: string | null;
}

export class UserModel implements User {
  id: string;
  email: string;
  username: string;
  userType: 'professional' | 'parent' | 'other';
  accepteConditions: boolean;
  resetToken: string | null;
  resetTokenExpiry: string | null;
  dateJoined: string;
  lastUpdated: string;
  securityQuestion: string;
  securityAnswer: string;
  bio: string | null;

  constructor(
    id: string,
    email: string,
    username: string,
    userType: 'professional' | 'parent' | 'other',
    accepteConditions: boolean,
    resetToken: string | null,
    resetTokenExpiry: string | null,
    dateJoined: string,
    lastUpdated: string,
    securityQuestion: string,
    securityAnswer: string,
    bio: string | null
  ) {
    this.id = id;
    this.email = email;
    this.username = username;
    this.userType = userType;
    this.accepteConditions = accepteConditions;
    this.resetToken = resetToken;
    this.resetTokenExpiry = resetTokenExpiry;
    this.dateJoined = dateJoined;
    this.lastUpdated = lastUpdated;
    this.securityQuestion = securityQuestion;
    this.securityAnswer = securityAnswer;
    this.bio = bio;
  }

  isParent(): boolean {
    return this.userType === 'parent';
  }

  isProfessional(): boolean {
    return this.userType === 'professional';
  }

  verifySecurityAnswer(rawAnswer: string): boolean {
    return this.securityAnswer === rawAnswer;
  }
}
