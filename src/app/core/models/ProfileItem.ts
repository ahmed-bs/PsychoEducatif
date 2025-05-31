export interface ProfileItem {
  id: number;
  name: string;
  description: string;
  etat: 'ACQUIS' | 'PARTIEL' | 'NON_ACQUIS' | 'NON_COTE';
  profile_domain: number;
  is_modified: boolean;
  modified_at: string;
  commentaire?: string; // New field
}