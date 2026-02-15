import type { CaseStatus } from "@sheila/shared/types";

export interface CaseStatusResult {
  status: CaseStatus;
  progress_percent: number;
}

/**
 * Stub: recomputes the overall status and progress for a case.
 * Future implementation will aggregate document statuses, flag counts,
 * and checklist completion to produce an accurate result.
 */
export async function recomputeCaseStatus(
  _caseId: string,
): Promise<CaseStatusResult> {
  return { status: "InProgress", progress_percent: 0 };
}
