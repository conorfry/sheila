import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { parseBody } from "../lib/validate.js";
import { authHook, verifyCaseOwnership } from "../lib/auth.js";
import { scoreCase } from "@sheila/visa-rules/scoring";

const quizBodySchema = z.object({
  responses: z
    .array(
      z.object({
        question_id: z.string().min(1),
        answer_json: z.unknown(),
      }),
    )
    .min(1),
});

export async function quizRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", authHook);

  // POST /cases/:caseId/quiz -- upsert quiz responses
  app.post<{ Params: { caseId: string } }>(
    "/cases/:caseId/quiz",
    async (request, reply) => {
      const { caseId } = request.params;

      const caseRow = await verifyCaseOwnership(caseId, request.userId, reply);
      if (!caseRow) return;

      const body = parseBody(quizBodySchema, request.body, reply);
      if (!body) return;

      const rows = body.responses.map((r) => ({
        case_id: caseId,
        question_id: r.question_id,
        answer_json: r.answer_json,
      }));

      const { error } = await supabase
        .from("quiz_responses")
        .upsert(rows, { onConflict: "case_id,question_id" });

      if (error) {
        request.log.error({ err: error }, "Failed to upsert quiz responses");
        return reply
          .code(500)
          .send({ success: false, data: null, error: "Failed to save quiz responses" });
      }

      // Touch updated_at on the case
      await supabase
        .from("cases")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", caseId);

      return reply.send({
        success: true,
        data: { count: rows.length },
        error: null,
      });
    },
  );

  // POST /cases/:caseId/recommendation -- score and recommend visa
  app.post<{ Params: { caseId: string } }>(
    "/cases/:caseId/recommendation",
    async (request, reply) => {
      const { caseId } = request.params;

      const caseRow = await verifyCaseOwnership(caseId, request.userId, reply);
      if (!caseRow) return;

      const { data: responses, error } = await supabase
        .from("quiz_responses")
        .select("question_id, answer_json")
        .eq("case_id", caseId);

      if (error) {
        request.log.error({ err: error }, "Failed to load quiz responses");
        return reply
          .code(500)
          .send({ success: false, data: null, error: "Failed to load quiz responses" });
      }

      if (!responses || responses.length === 0) {
        return reply.code(400).send({
          success: false,
          data: null,
          error: "No quiz responses found for this case",
        });
      }

      const recommendation = scoreCase(responses);

      const { error: updateError } = await supabase
        .from("cases")
        .update({
          visa_type: recommendation.primaryVisa,
          status: "InProgress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", caseId);

      if (updateError) {
        request.log.error({ err: updateError }, "Failed to update case after scoring");
        return reply
          .code(500)
          .send({ success: false, data: null, error: "Failed to update case" });
      }

      return reply.send({
        success: true,
        data: recommendation,
        error: null,
      });
    },
  );
}
