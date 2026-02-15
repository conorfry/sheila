import type { FastifyReply } from "fastify";
import { ZodSchema, ZodError } from "zod";

/**
 * Parses the given data against a Zod schema.
 * On failure, sends a 400 response with validation details and returns null.
 * On success, returns the parsed (and typed) value.
 */
export function parseBody<T>(
  schema: ZodSchema<T>,
  data: unknown,
  reply: FastifyReply,
): T | null {
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      reply.code(400).send({
        success: false,
        data: null,
        error: `Validation failed: ${details}`,
      });
      return null;
    }
    throw err;
  }
}
