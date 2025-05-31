export interface ProfileDomain {
  id: number;
  name: string;
  description: string;
  profile_category: number;
  item_count: number;
  acquis_percentage: number;
  start_date?: string; 
  last_eval_date?: string;
  acquis_count?: number; // Add count for Acquis items
  non_acquis_count?: number; // Add count for Non Acquis items
  en_cours_count?: number; // Add count for En Cours items
}

// Interface for the API response
export interface DomainsResponse {
  message: string;
  data: ProfileDomain[];
}
