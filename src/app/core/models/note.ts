export interface Note {
  id?: number;
  user?: number;
  user_username?: string;
  content: string;
  is_important: boolean;
  created_at?: string;
  updated_at?: string;
}