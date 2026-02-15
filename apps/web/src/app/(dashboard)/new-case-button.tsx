"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Case } from "@/lib/types";

export function NewCaseButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const created = await api.post<Case>("/cases");
      router.push(`/case/${created.id}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleCreate} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Plus className="mr-2 h-4 w-4" />
      )}
      New Case
    </Button>
  );
}
