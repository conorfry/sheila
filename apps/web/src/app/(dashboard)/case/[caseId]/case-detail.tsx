"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import type { Case, CaseWithCounts } from "@/lib/types";
import { CaseStatusBadge } from "./status-badge";
import { QuizSection } from "./quiz-section";
import { ChecklistSection } from "./checklist-section";
import { FlagsSection } from "./flags-section";
import { ExportSection } from "./export-section";

export function CaseDetail({ initialCase }: { initialCase: Case }) {
  const [caseData, setCaseData] = useState<Case>(initialCase);

  const refreshCase = useCallback(async () => {
    try {
      const updated = await api.get<CaseWithCounts>(`/cases/${caseData.id}`);
      setCaseData(updated);
    } catch {
      // silently ignore refresh failures
    }
  }, [caseData.id]);

  const isDraft = caseData.status === "Draft";
  const hasVisa = caseData.visa_type !== null;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to cases
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">
          {caseData.visa_type
            ? caseData.visa_type.replace("Subclass", "Subclass ")
            : "New Case"}
        </h1>
        <CaseStatusBadge status={caseData.status} />
      </div>

      <Progress value={caseData.progress_percent} className="h-2" />

      <Separator />

      <QuizSection
        caseId={caseData.id}
        readOnly={!isDraft}
        onComplete={refreshCase}
      />

      {hasVisa && (
        <>
          <Separator />
          <ChecklistSection caseId={caseData.id} />
        </>
      )}

      {hasVisa && (
        <>
          <Separator />
          <FlagsSection caseId={caseData.id} />
        </>
      )}

      {hasVisa && !isDraft && (
        <>
          <Separator />
          <ExportSection caseId={caseData.id} />
        </>
      )}
    </div>
  );
}
