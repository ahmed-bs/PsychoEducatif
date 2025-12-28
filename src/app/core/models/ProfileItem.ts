export interface ProfileItem {
  id: number;
  name: string;
  name_ar?: string;
  name_en?: string;
  description: string;
  description_ar?: string;
  description_en?: string;
  etat: 'ACQUIS' | 'PARTIEL' | 'NON_ACQUIS' | 'NON_COTE';
  profile_domain: number;
  profile_domain_name: string; // Added field for domain name
  profile_domain_name_ar?: string; // Added field for Arabic domain name
  profile_domain_name_en?: string; // Added field for English domain name
  profile_category_name: string; // Added field for category name
  profile_category_name_ar?: string; // Added field for Arabic category name
  profile_category_name_en?: string; // Added field for English category name
  is_modified: boolean;
  modified_at: string;
  comentaire?: string; // Keep for backward compatibility
  commentaire?: string; // Correct spelling from API
  commentaire_ar?: string;
  commentaire_en?: string; // English comment field
  strategie?: string; // Strategy text field from API
  strategie_ar?: string; // Arabic strategy text field from API
  strategie_en?: string; // English strategy text field from API
  isPeu?: boolean;
  done?: boolean;
}