import type { FastifyInstance } from "fastify";
import { supabase } from "../lib/supabase.js";
import { authHook, verifyCaseOwnership } from "../lib/auth.js";
import { getChecklist } from "@sheila/visa-rules/checklist";
import type { VisaType } from "@sheila/shared/types";

type UploadStatus = "Missing" | "Uploaded" | "Flagged" | "Verified";

function mapDocStatusToUploadStatus(docStatus: string): UploadStatus {
  switch (docStatus) {
    case "Uploaded":
    case "Processing":
      return "Uploaded";
    case "Flagged":
    case "Failed":
      return "Flagged";
    case "Reviewed":
      return "Verified";
    default:
      return "Missing";
  }
}

export async function checklistRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", authHook);

  // GET /cases/:caseId/checklist -- checklist with upload statuses
  app.get<{ Params: { caseId: string } }>(
    "/cases/:caseId/checklist",
    async (request, reply) => {
      const { caseId } = request.params;

      const caseRow = await verifyCaseOwnership(caseId, request.userId, reply);
      if (!caseRow) return;

      if (!caseRow.visa_type) {
        return reply.code(400).send({
          success: false,
          data: null,
          error: "Complete assessment first",
        });
      }

      const slots = getChecklist(caseRow.visa_type as VisaType);

      // Fetch all documents for this case so we can match by slot_key
      const { data: docs } = await supabase
        .from("documents")
        .select("slot_key, status")
        .eq("case_id", caseId);

      // Build a map of slot_key to latest document status
      const docMap = new Map<string, string>();
      if (docs) {
        for (const doc of docs) {
          docMap.set(doc.slot_key, doc.status);
        }
      }

      const slotsWithStatus = slots.map((slot) => {
        const docStatus = docMap.get(slot.slot_key);
        const upload_status: UploadStatus = docStatus
          ? mapDocStatusToUploadStatus(docStatus)
          : "Missing";
        return { ...slot, upload_status };
      });

      return reply.send({
        success: true,
        data: { visa_type: caseRow.visa_type, slots: slotsWithStatus },
        error: null,
      });
    },
  );
}
