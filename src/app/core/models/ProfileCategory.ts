// Interface for ProfileCategory
export interface ProfileCategory {
  id?: number;
  name: string;
  name_ar?: string;
  name_en?: string;
  description?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  profile: number; 
  created_at?: string; 
  domains_count?: number; 
  items_count?: number; 
}