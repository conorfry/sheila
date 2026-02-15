import Link from "next/link";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NewCaseButton } from "./new-case-button";
import type { Case, CaseStatus } from "@/lib/types";

const statusVariant: Record<CaseStatus, "default" | "secondary" | "destructive" | "outline"> = {
  Draft: "secondary",
  InProgress: "default",
  ActionRequired: "destructive",
  ReadyForReview: "outline",
  ReadyForExport: "outline",
  Exported: "secondary",
};

function formatVisaType(visa: string | null): string {
  if (!visa) return "Not assessed";
  return visa.replace("Subclass", "Subclass ");
}

function formatStatus(status: CaseStatus): string {
  return status.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: cases } = await supabase
    .from("cases")
    .select("*")
    .order("updated_at", { ascending: false });

  const caseList = (cases ?? []) as Case[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Cases</h1>
        <NewCaseButton />
      </div>

      {caseList.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-muted-foreground">
          <FileText className="h-12 w-12" />
          <p className="mt-4 text-lg">No cases yet</p>
          <p className="text-sm">Click &quot;New Case&quot; to get started.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {caseList.map((c) => (
            <Link key={c.id} href={`/case/${c.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {formatVisaType(c.visa_type)}
                    </CardTitle>
                    <Badge variant={statusVariant[c.status]}>
                      {formatStatus(c.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={c.progress_percent} className="h-2" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {c.progress_percent}% complete
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
