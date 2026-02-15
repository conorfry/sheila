import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { DEFAULT_PORT } from "@sheila/shared/constants";
import { casesRoutes } from "./routes/cases.js";
import { quizRoutes } from "./routes/quiz.js";
import { checklistRoutes } from "./routes/checklist.js";
import { documentsRoutes } from "./routes/documents.js";
import { flagsRoutes } from "./routes/flags.js";
import { exportsRoutes } from "./routes/exports.js";

const port = Number(process.env.PORT) || DEFAULT_PORT;

const app = Fastify({
  logger: {
    transport:
      process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty" }
        : undefined,
  },
});

await app.register(cors, { origin: true });
await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });

// Health check (no auth required)
app.get("/health", async () => ({ success: true, data: { ok: true }, error: null }));

// Register route modules
await app.register(casesRoutes);
await app.register(quizRoutes);
await app.register(checklistRoutes);
await app.register(documentsRoutes);
await app.register(flagsRoutes);
await app.register(exportsRoutes);

try {
  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`Sheila API listening on port ${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
