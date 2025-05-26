export interface ProfileDomain {
  id: number;
  name: string;
  description: string;
  profile_category: number;
  item_count: number;
  acquis_percentage: number;
  start_date?: string; 
  last_eval_date?: string;
}

// Interface for the API response
export interface DomainsResponse {
  message: string;
  data: ProfileDomain[];
}
