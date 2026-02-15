import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CaseDetail } from "./case-detail";
import type { Case } from "@/lib/types";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .single();

  if (!data) notFound();

  return <CaseDetail initialCase={data as Case} />;
}
