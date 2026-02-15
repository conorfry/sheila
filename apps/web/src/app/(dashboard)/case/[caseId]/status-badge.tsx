import { Badge } from "@/components/ui/badge";
import type { CaseStatus, FlagSeverity, UploadStatus } from "@/lib/types";

const caseStatusConfig: Record<CaseStatus, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  Draft: { variant: "secondary" },
  InProgress: { variant: "default" },
  ActionRequired: { variant: "destructive" },
  ReadyForReview: { variant: "outline", className: "border-primary/40 text-primary" },
  ReadyForExport: { variant: "outline", className: "border-primary/40 text-primary" },
  Exported: { variant: "secondary" },
};

const severityConfig: Record<FlagSeverity, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  Verified: { variant: "default" },
  Review: { variant: "outline", className: "border-primary/40 text-primary" },
  PotentialBlocker: { variant: "destructive" },
};

const uploadConfig: Record<UploadStatus, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  Missing: { variant: "secondary" },
  Uploaded: { variant: "default" },
  Flagged: { variant: "destructive" },
  Verified: { variant: "outline", className: "border-primary/40 text-primary" },
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const label = status.replace(/([a-z])([A-Z])/g, "$1 $2");
  const config = caseStatusConfig[status];
  return <Badge variant={config.variant} className={config.className}>{label}</Badge>;
}

export function SeverityBadge({ severity }: { severity: FlagSeverity }) {
  const label = severity === "PotentialBlocker" ? "Potential Blocker" : severity;
  const config = severityConfig[severity];
  return <Badge variant={config.variant} className={config.className}>{label}</Badge>;
}

export function UploadStatusBadge({ status }: { status: UploadStatus }) {
  const config = uploadConfig[status];
  return <Badge variant={config.variant} className={config.className}>{status}</Badge>;
}
