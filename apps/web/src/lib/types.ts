// Frontend-local copies of API types

export type CaseStatus =
  | "Draft"
  | "InProgress"
  | "ActionRequired"
  | "ReadyForReview"
  | "ReadyForExport"
  | "Exported";

export type DocumentStatus =
  | "Uploaded"
  | "Processing"
  | "Reviewed"
  | "Flagged"
  | "Failed";

export type FlagSeverity = "Verified" | "Review" | "PotentialBlocker";

export type VisaType =
  | "Subclass189"
  | "Subclass190"
  | "Subclass482"
  | "Subclass491";

export type ExportStatus = "Pending" | "Processing" | "Complete" | "Failed";

export type UploadStatus = "Missing" | "Uploaded" | "Flagged" | "Verified";

export interface Case {
  id: string;
  user_id: string;
  visa_type: VisaType | null;
  status: CaseStatus;
  progress_percent: number;
  created_at: string;
  updated_at: string;
}

export interface CaseWithCounts extends Case {
  document_count: number;
  unresolved_flag_count: number;
}

export interface Document {
  id: string;
  case_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  category: string;
  slot_key: string;
  status: DocumentStatus;
  created_at: string;
}

export interface Flag {
  id: string;
  case_id: string;
  document_id: string | null;
  field: string;
  message: string;
  severity: FlagSeverity;
  is_resolved: boolean;
  created_at: string;
}

export interface ExportRecord {
  id: string;
  case_id: string;
  storage_path: string | null;
  status: ExportStatus;
  created_at: string;
}

export interface ChecklistSlotWithStatus {
  category: string;
  slot_key: string;
  required: boolean;
  description: string;
  accepted_mime: string[];
  upload_status: UploadStatus;
}

export interface ScoringResult {
  primaryVisa: VisaType;
  fallbackVisa: VisaType;
  rationale: string[];
  pointsTotal: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}
