import type { FastifyInstance } from "fastify";
import { supabase } from "../lib/supabase.js";
import { authHook, verifyCaseOwnership } from "../lib/auth.js";
import { JOB_NAMES, EXPORTS_BUCKET } from "@sheila/shared/constants";
import { exportsQueue } from "../queues.js";

export async function exportsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", authHook);

  // POST /cases/:caseId/export -- enqueue an export job
  app.post<{ Params: { caseId: string } }>(
    "/cases/:caseId/export",
    async (request, reply) => {
      const { caseId } = request.params;

      const caseRow = await verifyCaseOwnership(caseId, request.userId, reply);
      if (!caseRow) return;

      if (caseRow.status === "Draft") {
        return reply.code(400).send({
          success: false,
          data: null,
          error: "Cannot export a case that is still in Draft status",
        });
      }

      const { data: exportRecord, error: insertError } = await supabase
        .from("exports")
        .insert({ case_id: caseId, status: "Pending" })
        .select()
        .single();

      if (insertError) {
        request.log.error({ err: insertError }, "Failed to create export record");
        return reply.code(500).send({
          success: false,
          data: null,
          error: "Failed to create export record",
        });
      }

      await exportsQueue.add(JOB_NAMES.EXPORT_ZIP, {
        caseId,
        exportId: exportRecord.id,
      });

      const { error: updateError } = await supabase
        .from("cases")
        .update({
          status: "ReadyForExport",
          updated_at: new Date().toISOString(),
        })
        .eq("id", caseId);

      if (updateError) {
        request.log.error({ err: updateError }, "Failed to update case status for export");
        return reply.code(500).send({
          success: false,
          data: null,
          error: "Failed to update case status",
        });
      }

      return reply.send({
        success: true,
        data: { message: "Export queued" },
        error: null,
      });
    },
  );

  // GET /cases/:caseId/export -- get latest export with download URL
  app.get<{ Params: { caseId: string } }>(
    "/cases/:caseId/export",
    async (request, reply) => {
      const { caseId } = request.params;

      const caseRow = await verifyCaseOwnership(caseId, request.userId, reply);
      if (!caseRow) return;

      const { data: exportRow, error } = await supabase
        .from("exports")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        request.log.error({ err: error }, "Failed to fetch export record");
        return reply.code(500).send({
          success: false,
          data: null,
          error: "Failed to fetch export record",
        });
      }

      if (!exportRow) {
        return reply.send({
          success: true,
          data: { latestExport: null, downloadUrl: null },
          error: null,
        });
      }

      let downloadUrl: string | null = null;

      if (exportRow.storage_path) {
        const { data: signedData, error: signError } = await supabase.storage
          .from(EXPORTS_BUCKET)
          .createSignedUrl(exportRow.storage_path, 600);

        if (!signError && signedData) {
          downloadUrl = signedData.signedUrl;
        } else {
          request.log.warn(
            { err: signError },
            "Could not generate signed download URL",
          );
        }
      }

      return reply.send({
        success: true,
        data: { latestExport: exportRow, downloadUrl },
        error: null,
      });
    },
  );
}
