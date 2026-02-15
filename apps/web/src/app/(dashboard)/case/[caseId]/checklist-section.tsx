"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { ChecklistSlotWithStatus, VisaType } from "@/lib/types";
import { UploadStatusBadge } from "./status-badge";
import { FileUploadButton } from "./file-upload-button";

interface ChecklistSectionProps {
  caseId: string;
}

interface ChecklistResponse {
  visa_type: VisaType;
  slots: ChecklistSlotWithStatus[];
}

export function ChecklistSection({ caseId }: ChecklistSectionProps) {
  const [slots, setSlots] = useState<ChecklistSlotWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChecklist = useCallback(async () => {
    try {
      const data = await api.get<ChecklistResponse>(
        `/cases/${caseId}/checklist`,
      );
      setSlots(data.slots);
    } catch {
      // ignore errors for now
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  if (loading) {
    return (
      <section>
        <h2 className="text-lg font-semibold">Document Checklist</h2>
        <div className="mt-4 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading checklist...
        </div>
      </section>
    );
  }

  // Group slots by category
  const grouped = slots.reduce<Record<string, ChecklistSlotWithStatus[]>>(
    (acc, slot) => {
      const group = acc[slot.category] ?? [];
      group.push(slot);
      acc[slot.category] = group;
      return acc;
    },
    {},
  );

  return (
    <section>
      <h2 className="text-lg font-semibold">Document Checklist</h2>

      {Object.entries(grouped).map(([category, categorySlots]) => (
        <div key={category} className="mt-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            {category}
          </h3>
          <div className="mt-2 space-y-3">
            {categorySlots.map((slot) => (
              <div
                key={slot.slot_key}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {slot.description}
                    </span>
                    {slot.required && (
                      <Badge variant="outline" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  <UploadStatusBadge status={slot.upload_status} />
                </div>
                <FileUploadButton
                  caseId={caseId}
                  slotKey={slot.slot_key}
                  category={slot.category}
                  acceptedMime={slot.accepted_mime}
                  onUploadComplete={fetchChecklist}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
