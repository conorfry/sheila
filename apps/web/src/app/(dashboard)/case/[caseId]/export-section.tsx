"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Download, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { ExportRecord, ExportStatus } from "@/lib/types";

interface ExportSectionProps {
  caseId: string;
}

interface ExportResponse {
  latestExport: ExportRecord | null;
  downloadUrl: string | null;
}

export function ExportSection({ caseId }: ExportSectionProps) {
  const [latestExport, setLatestExport] = useState<ExportRecord | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchExport = useCallback(async () => {
    try {
      const data = await api.get<ExportResponse>(
        `/cases/${caseId}/export`,
      );
      setLatestExport(data.latestExport);
      setDownloadUrl(data.downloadUrl);
      return data.latestExport?.status ?? null;
    } catch {
      return null;
    }
  }, [caseId]);

  const startPolling = useCallback(() => {
    setPolling(true);
    pollRef.current = setInterval(async () => {
      const status = await fetchExport();
      if (status === "Complete" || status === "Failed") {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        setPolling(false);
      }
    }, 3000);
  }, [fetchExport]);

  useEffect(() => {
    fetchExport().then((status) => {
      if (status === "Pending" || status === "Processing") {
        startPolling();
      }
    });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchExport, startPolling]);

  async function handleExport() {
    setLoading(true);
    try {
      await api.post(`/cases/${caseId}/export`);
      await fetchExport();
      startPolling();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const isPending = latestExport?.status === "Pending" || latestExport?.status === "Processing";

  return (
    <section>
      <h2 className="text-lg font-semibold">Export</h2>

      <div className="mt-4">
        <Button onClick={handleExport} disabled={loading || polling}>
          {loading || polling ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Package className="mr-2 h-4 w-4" />
          )}
          {polling ? "Exporting..." : "Export Case"}
        </Button>
      </div>

      {latestExport && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Status: {latestExport.status}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(latestExport.created_at).toLocaleString()}
                </p>
              </div>
              {latestExport.status === "Complete" && downloadUrl && (
                <Button asChild variant="outline" size="sm">
                  <a href={downloadUrl} download>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </a>
                </Button>
              )}
              {isPending && (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
