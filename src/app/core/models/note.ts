import { Profile } from "./profile.model";

export interface Note {
  id?: number;
  profile_id: number;
  profile?: Profile;
  author_username?: string;
  content: string;
  is_important: boolean;
  created_at?: string;
  updated_at?: string;
}