// -- Case lifecycle statuses --
export type CaseStatus =
  | "Draft"
  | "InProgress"
  | "ActionRequired"
  | "ReadyForReview"
  | "ReadyForExport"
  | "Exported";

// -- Document processing statuses --
export type DocumentStatus =
  | "Uploaded"
  | "Processing"
  | "Reviewed"
  | "Flagged"
  | "Failed";

// -- Flag severity levels --
export type FlagSeverity = "Verified" | "Review" | "PotentialBlocker";

// -- Supported visa subclasses --
export type VisaType =
  | "Subclass189"
  | "Subclass190"
  | "Subclass482"
  | "Subclass491";

// -- Core domain interfaces --

export interface Case {
  id: string;
  user_id: string;
  visa_type: VisaType | null;
  status: CaseStatus;
  progress_percent: number;
  created_at: string;
  updated_at: string;
}

export interface QuizResponse {
  id: string;
  case_id: string;
  question_id: string;
  answer_json: unknown;
  created_at: string;
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
  status: "Pending" | "Processing" | "Complete" | "Failed";
  created_at: string;
}
