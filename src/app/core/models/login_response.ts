import { User } from "./users"; 

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}