import { Badge } from "@/components/ui/badge";
import type { CaseStatus, FlagSeverity, UploadStatus } from "@/lib/types";

const caseStatusVariant: Record<CaseStatus, "default" | "secondary" | "destructive" | "outline"> = {
  Draft: "secondary",
  InProgress: "default",
  ActionRequired: "destructive",
  ReadyForReview: "outline",
  ReadyForExport: "outline",
  Exported: "secondary",
};

const severityVariant: Record<FlagSeverity, "default" | "secondary" | "destructive" | "outline"> = {
  Verified: "default",
  Review: "outline",
  PotentialBlocker: "destructive",
};

const uploadVariant: Record<UploadStatus, "default" | "secondary" | "destructive" | "outline"> = {
  Missing: "secondary",
  Uploaded: "default",
  Flagged: "destructive",
  Verified: "outline",
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const label = status.replace(/([a-z])([A-Z])/g, "$1 $2");
  return <Badge variant={caseStatusVariant[status]}>{label}</Badge>;
}

export function SeverityBadge({ severity }: { severity: FlagSeverity }) {
  const label = severity === "PotentialBlocker" ? "Potential Blocker" : severity;
  return <Badge variant={severityVariant[severity]}>{label}</Badge>;
}

export function UploadStatusBadge({ status }: { status: UploadStatus }) {
  return <Badge variant={uploadVariant[status]}>{status}</Badge>;
}
