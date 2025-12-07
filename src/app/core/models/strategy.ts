export interface Strategy {
  id?: number;
  profile: number;
  author?: number;
  author_username?: string;
  profile_name?: string;
  title: string;
  description: string;
  status: string;
  responsible?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryWithPartielItems {
  value: number;
  label: string;
  label_ar?: string;
  description?: string;
  description_ar?: string;
  profile_id: number;
  profile_name: string;
  domains_count: number;
  items_count: number;
}

export interface CategoriesWithPartielItemsResponse {
  message: string;
  data: CategoryWithPartielItems[];
  count: number;
}