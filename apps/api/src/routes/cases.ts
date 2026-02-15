import type { FastifyInstance } from "fastify";
import { supabase } from "../lib/supabase.js";
import { authHook, verifyCaseOwnership } from "../lib/auth.js";

export async function casesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", authHook);

  // POST /cases -- create a new case
  app.post("/cases", async (request, reply) => {
    const { data, error } = await supabase
      .from("cases")
      .insert({
        user_id: request.userId,
        status: "Draft",
        progress_percent: 0,
      })
      .select()
      .single();

    if (error) {
      request.log.error({ err: error }, "Failed to create case");
      return reply
        .code(500)
        .send({ success: false, data: null, error: "Failed to create case" });
    }

    return reply.code(201).send({ success: true, data, error: null });
  });

  // GET /cases/:caseId -- return case with doc and flag counts
  app.get<{ Params: { caseId: string } }>(
    "/cases/:caseId",
    async (request, reply) => {
      const { caseId } = request.params;

      const caseRow = await verifyCaseOwnership(caseId, request.userId, reply);
      if (!caseRow) return;

      const [docCountRes, flagCountRes] = await Promise.all([
        supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("case_id", caseId),
        supabase
          .from("flags")
          .select("id", { count: "exact", head: true })
          .eq("case_id", caseId)
          .eq("is_resolved", false),
      ]);

      return reply.send({
        success: true,
        data: {
          ...caseRow,
          document_count: docCountRes.count ?? 0,
          unresolved_flag_count: flagCountRes.count ?? 0,
        },
        error: null,
      });
    },
  );
}
