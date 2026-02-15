import type { FastifyRequest, FastifyReply } from "fastify";
import { supabase } from "./supabase.js";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

/**
 * Auth hook that validates the Supabase JWT from the Authorization header.
 * Attaches userId to the request on success; returns 401 on failure.
 */
export async function authHook(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    reply
      .code(401)
      .send({ success: false, data: null, error: "Missing or malformed Authorization header" });
    return;
  }

  const token = header.slice(7);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    reply
      .code(401)
      .send({ success: false, data: null, error: "Invalid or expired token" });
    return;
  }

  request.userId = user.id;
}

/**
 * Verify the authenticated user owns the given case.
 * Returns the case row on success, or sends an error response and returns null.
 */
export async function verifyCaseOwnership(
  caseId: string,
  userId: string,
  reply: FastifyReply,
): Promise<Record<string, unknown> | null> {
  const { data: caseRow, error } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .single();

  if (error || !caseRow) {
    reply
      .code(404)
      .send({ success: false, data: null, error: "Case not found" });
    return null;
  }

  if (caseRow.user_id !== userId) {
    reply
      .code(403)
      .send({ success: false, data: null, error: "You do not have access to this case" });
    return null;
  }

  return caseRow;
}
