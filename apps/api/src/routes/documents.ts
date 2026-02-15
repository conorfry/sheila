import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { supabase } from "../lib/supabase.js";
import { parseBody } from "../lib/validate.js";
import { authHook, verifyCaseOwnership } from "../lib/auth.js";
import { STORAGE_BUCKET, JOB_NAMES } from "@sheila/shared/constants";
import { documentsQueue } from "../queues.js";

const ALLOWED_MIMES = ["application/pdf", "image/jpeg", "image/png"] as const;

const presignBodySchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.enum(ALLOWED_MIMES),
  category: z.string().min(1),
  slot_key: z.string().min(1),
});

const completeBodySchema = z.object({
  storage_path: z.string().min(1),
  file_name: z.string().min(1),
  mime_type: z.string().min(1),
  size_bytes: z.number().int().positive(),
  category: z.string().min(1),
  slot_key: z.string().min(1),
});

// Strip characters that could cause path issues
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function documentsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", authHook);

  // POST /cases/:caseId/documents/presign -- get a signed upload URL
  app.post<{ Params: { caseId: string } }>(
    "/cases/:caseId/documents/presign",
    async (request, reply) => {
      const { caseId } = request.params;

      const caseRow = await verifyCaseOwnership(caseId, request.userId, reply);
      if (!caseRow) return;

      const body = parseBody(presignBodySchema, request.body, reply);
      if (!body) return;

      const safeName = sanitizeFileName(body.fileName);
      const storagePath = `cases/${caseId}/${randomUUID()}-${safeName}`;

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUploadUrl(storagePath);

      if (error) {
        request.log.error({ err: error }, "Failed to create signed upload URL");
        return reply.code(500).send({
          success: false,
          data: null,
          error: "Failed to create signed upload URL",
        });
      }

      return reply.send({
        success: true,
        data: {
          uploadUrl: data.signedUrl,
          storagePath,
        },
        error: null,
      });
    },
  );

  // POST /cases/:caseId/documents/upload -- server-side file upload fallback
  app.post<{ Params: { caseId: string } }>(
    "/cases/:caseId/documents/upload",
    async (request, reply) => {
      const { caseId } = request.params;

      const caseRow = await verifyCaseOwnership(caseId, request.userId, reply);
      if (!caseRow) return;

      const file = await (request as any).file();
      if (!file) {
        return reply.code(400).send({
          success: false,
          data: null,
          error: "No file provided",
        });
      }

      const safeName = sanitizeFileName(file.filename);
      const storagePath = `cases/${caseId}/${randomUUID()}-${safeName}`;
      const buffer = await file.toBuffer();

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, buffer, { contentType: file.mimetype });

      if (error) {
        request.log.error({ err: error }, "Failed to upload file to storage");
        return reply.code(500).send({
          success: false,
          data: null,
          error: "Failed to upload file",
        });
      }

      return reply.send({
        success: true,
        data: { storagePath },
        error: null,
      });
    },
  );

  // POST /cases/:caseId/documents/complete -- record upload and enqueue processing
  app.post<{ Params: { caseId: string } }>(
    "/cases/:caseId/documents/complete",
    async (request, reply) => {
      const { caseId } = request.params;

      const caseRow = await verifyCaseOwnership(caseId, request.userId, reply);
      if (!caseRow) return;

      const body = parseBody(completeBodySchema, request.body, reply);
      if (!body) return;

      const { data: doc, error } = await supabase
        .from("documents")
        .insert({
          case_id: caseId,
          storage_path: body.storage_path,
          file_name: body.file_name,
          mime_type: body.mime_type,
          size_bytes: body.size_bytes,
          category: body.category,
          slot_key: body.slot_key,
          status: "Uploaded",
        })
        .select()
        .single();

      if (error) {
        request.log.error({ err: error }, "Failed to insert document record");
        return reply.code(500).send({
          success: false,
          data: null,
          error: "Failed to record document",
        });
      }

      await documentsQueue.add(JOB_NAMES.PROCESS_DOCUMENT, {
        documentId: doc.id,
        caseId,
      });

      return reply.code(201).send({
        success: true,
        data: doc,
        error: null,
      });
    },
  );

  // GET /cases/:caseId/documents -- list documents
  app.get<{ Params: { caseId: string } }>(
    "/cases/:caseId/documents",
    async (request, reply) => {
      const { caseId } = request.params;

      const caseRow = await verifyCaseOwnership(caseId, request.userId, reply);
      if (!caseRow) return;

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) {
        request.log.error({ err: error }, "Failed to list documents");
        return reply.code(500).send({
          success: false,
          data: null,
          error: "Failed to list documents",
        });
      }

      return reply.send({ success: true, data, error: null });
    },
  );
}
