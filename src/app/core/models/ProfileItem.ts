export interface ProfileItem {
  id: number;
  name: string;
  name_ar?: string;
  description: string;
  description_ar?: string;
  etat: 'ACQUIS' | 'PARTIEL' | 'NON_ACQUIS' | 'NON_COTE';
  profile_domain: number;
  profile_domain_name: string; // Added field for domain name
  profile_domain_name_ar?: string; // Added field for Arabic domain name
  profile_category_name: string; // Added field for category name
  profile_category_name_ar?: string; // Added field for Arabic category name
  is_modified: boolean;
  modified_at: string;
  comentaire?: string;
  commentaire_ar?: string;
}