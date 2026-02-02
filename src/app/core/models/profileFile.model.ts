export interface ProfileFile {
  id: number;
  profile: number;
  original_filename: string;
  file: string;
  file_url: string;
  file_type: string;
  file_size: number;
  file_size_mb: number;
  compressed_size: number;
  compressed_size_mb: number;
  compression_ratio: number;
  uploaded_by: number;
  uploaded_by_username: string;
  uploaded_at: string;
  description?: string;
}

export interface ProfileFilesResponse {
  message: string;
  data: ProfileFile[];
  count: number;
}

export interface ProfileFileUploadResponse {
  message: string;
  data: ProfileFile;
}

