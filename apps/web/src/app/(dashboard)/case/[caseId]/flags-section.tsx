"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { Flag } from "@/lib/types";
import { SeverityBadge } from "./status-badge";

interface FlagsSectionProps {
  caseId: string;
}

export function FlagsSection({ caseId }: FlagsSectionProps) {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    try {
      const data = await api.get<Flag[]>(`/cases/${caseId}/flags`);
      setFlags(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  async function toggleResolve(flagId: string, currentResolved: boolean) {
    // Optimistic update
    setFlags((prev) =>
      prev.map((f) =>
        f.id === flagId ? { ...f, is_resolved: !currentResolved } : f,
      ),
    );
    try {
      await api.post(`/flags/${flagId}/resolve`, {
        is_resolved: !currentResolved,
      });
    } catch {
      // Revert on failure
      setFlags((prev) =>
        prev.map((f) =>
          f.id === flagId ? { ...f, is_resolved: currentResolved } : f,
        ),
      );
    }
  }

  if (loading) {
    return (
      <section>
        <h2 className="text-lg font-semibold">Flags</h2>
        <div className="mt-4 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading flags...
        </div>
      </section>
    );
  }

  if (flags.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold">Flags</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No flags have been raised for this case.
        </p>
      </section>
    );
  }

  // Sort: unresolved first
  const sorted = [...flags].sort((a, b) => {
    if (a.is_resolved === b.is_resolved) return 0;
    return a.is_resolved ? 1 : -1;
  });

  return (
    <section>
      <h2 className="text-lg font-semibold">Flags</h2>
      <div className="mt-4 space-y-3">
        {sorted.map((flag) => (
          <div
            key={flag.id}
            className={`flex items-center justify-between rounded-lg border p-3 ${
              flag.is_resolved ? "opacity-50" : ""
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={flag.severity} />
                <span className="text-sm font-medium">{flag.field}</span>
              </div>
              <p className="text-sm text-muted-foreground">{flag.message}</p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`resolve-${flag.id}`} className="text-xs">
                Resolved
              </Label>
              <Switch
                id={`resolve-${flag.id}`}
                checked={flag.is_resolved}
                onCheckedChange={() =>
                  toggleResolve(flag.id, flag.is_resolved)
                }
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
