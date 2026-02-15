import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { parseBody } from "../lib/validate.js";
import { authHook, verifyCaseOwnership } from "../lib/auth.js";

const resolveBodySchema = z.object({
  is_resolved: z.boolean(),
});

export async function flagsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", authHook);

  // GET /cases/:caseId/flags -- list flags for a case
  app.get<{ Params: { caseId: string } }>(
    "/cases/:caseId/flags",
    async (request, reply) => {
      const { caseId } = request.params;

      const caseRow = await verifyCaseOwnership(caseId, request.userId, reply);
      if (!caseRow) return;

      const { data, error } = await supabase
        .from("flags")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) {
        request.log.error({ err: error }, "Failed to list flags");
        return reply.code(500).send({
          success: false,
          data: null,
          error: "Failed to list flags",
        });
      }

      return reply.send({ success: true, data, error: null });
    },
  );

  // POST /flags/:flagId/resolve -- resolve or unresolve a flag
  app.post<{ Params: { flagId: string } }>(
    "/flags/:flagId/resolve",
    async (request, reply) => {
      const body = parseBody(resolveBodySchema, request.body, reply);
      if (!body) return;

      const { flagId } = request.params;

      const { data, error } = await supabase
        .from("flags")
        .update({ is_resolved: body.is_resolved })
        .eq("id", flagId)
        .select()
        .single();

      if (error) {
        return reply.code(404).send({
          success: false,
          data: null,
          error: "Flag not found",
        });
      }

      return reply.send({ success: true, data, error: null });
    },
  );
}
