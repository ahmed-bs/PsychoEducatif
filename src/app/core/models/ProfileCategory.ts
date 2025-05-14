// Interface for ProfileCategory
export interface ProfileCategory {
  id?: number;
  name: string;
  description?: string | null;
  profile: number; 
  created_at?: string; 
  domains_count?: number; 
  items_count?: number; 
}