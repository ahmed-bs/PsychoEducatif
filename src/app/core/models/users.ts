export interface User {
  user_id: number;
  email: string;
  username: string;
  token?: string; // Optional since it comes in the response
}