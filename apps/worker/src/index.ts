import { Worker } from "bullmq";
import { QUEUE_NAMES } from "@sheila/shared/constants";
import { connection } from "./lib/queue.js";
import { logger } from "./lib/logger.js";
import { processDocument } from "./jobs/processDocument.js";
import { exportZip } from "./jobs/exportZip.js";

const log = logger.child({ service: "worker" });

// Documents worker
const documentsWorker = new Worker(
  QUEUE_NAMES.DOCUMENTS,
  async (job) => {
    await processDocument(job);
  },
  { connection, concurrency: 5 },
);

documentsWorker.on("completed", (job) => {
  log.info({ jobId: job.id, name: job.name }, "Job completed");
});

documentsWorker.on("failed", (job, err) => {
  log.error({ jobId: job?.id, name: job?.name, err: err.message }, "Job failed");
});

// Exports worker
const exportsWorker = new Worker(
  QUEUE_NAMES.EXPORTS,
  async (job) => {
    await exportZip(job);
  },
  { connection, concurrency: 2 },
);

exportsWorker.on("completed", (job) => {
  log.info({ jobId: job.id, name: job.name }, "Job completed");
});

exportsWorker.on("failed", (job, err) => {
  log.error({ jobId: job?.id, name: job?.name, err: err.message }, "Job failed");
});

log.info("Sheila worker started -- listening for jobs");

// Graceful shutdown
async function shutdown(): Promise<void> {
  log.info("Shutting down workers...");
  await Promise.all([documentsWorker.close(), exportsWorker.close()]);
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
