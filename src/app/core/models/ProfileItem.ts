export interface ProfileItem {
  id: number;
  name: string;
  description: string;
  etat: 'ACQUIS' | 'PARTIEL' | 'NON_ACQUIS' | 'NON_COTE';
  profile_domain: number;
  profile_domain_name: string; // Added field for domain name
  profile_category_name: string; // Added field for category name
  is_modified: boolean;
  modified_at: string;
  comentaire?: string;
}