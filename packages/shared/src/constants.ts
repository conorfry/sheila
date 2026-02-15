export const STORAGE_BUCKET = "sheila-docs";
export const EXPORTS_BUCKET = "sheila-exports";

export const QUEUE_NAMES = {
  DOCUMENTS: "documents",
  EXPORTS: "exports",
} as const;

export const JOB_NAMES = {
  PROCESS_DOCUMENT: "processDocument",
  EXPORT_ZIP: "exportZip",
} as const;

export const DEFAULT_PORT = 8080;
