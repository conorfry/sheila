import { supabase } from "./supabase.js";
import { logger } from "./logger.js";
import type { CaseStatus } from "@sheila/shared/types";

const log = logger.child({ module: "status" });

/**
 * Recomputes the case status based on its documents and flags.
 *
 * Logic:
 *  - Any document Processing -> InProgress
 *  - Any unresolved PotentialBlocker flag -> ActionRequired
 *  - All docs Reviewed/Verified and no unresolved blockers -> ReadyForExport
 *  - No documents yet -> Draft
 *  - Otherwise -> InProgress
 */
export async function recomputeCaseStatus(caseId: string): Promise<void> {
  const { data: docs } = await supabase
    .from("documents")
    .select("status")
    .eq("case_id", caseId);

  const { data: flags } = await supabase
    .from("flags")
    .select("severity, is_resolved")
    .eq("case_id", caseId);

  if (!docs || docs.length === 0) {
    await updateStatus(caseId, "Draft");
    return;
  }

  const anyProcessing = docs.some((d) => d.status === "Processing");
  if (anyProcessing) {
    await updateStatus(caseId, "InProgress");
    return;
  }

  const unresolvedBlockers = (flags ?? []).filter(
    (f) => f.severity === "PotentialBlocker" && !f.is_resolved,
  );

  if (unresolvedBlockers.length > 0) {
    await updateStatus(caseId, "ActionRequired");
    return;
  }

  const allDone = docs.every(
    (d) => d.status === "Reviewed" || d.status === "Flagged",
  );

  if (allDone) {
    await updateStatus(caseId, "ReadyForExport");
    return;
  }

  await updateStatus(caseId, "InProgress");
}

async function updateStatus(caseId: string, status: CaseStatus): Promise<void> {
  log.info({ caseId, status }, "Updating case status");
  await supabase
    .from("cases")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", caseId);
}
