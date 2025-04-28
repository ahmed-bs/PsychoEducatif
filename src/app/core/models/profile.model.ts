export interface Profile {
  id?: number;
  parent?: number;
  first_name: string;
  last_name: string;
  birth_date: string; // ISO date string (e.g., "2020-05-15")
  diagnosis?: string;
  notes?: string;
  gender?: 'M' | 'F' ;
  evaluation_score?: number;
  objectives?: string[];
  progress?: string;
  recommended_strategies?: string[];
  image_url?: string;
  is_active?: boolean;
  created_at?: string;
  category?: string;
}
export interface ProfileResponse {
  message: string;
  data: Profile;
}