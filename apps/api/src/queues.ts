import { Queue } from "bullmq";
import { QUEUE_NAMES } from "@sheila/shared/constants";

const connection = {
  host: new URL(process.env.REDIS_URL || "redis://localhost:6379").hostname,
  port: Number(
    new URL(process.env.REDIS_URL || "redis://localhost:6379").port || 6379,
  ),
};

export const documentsQueue = new Queue(QUEUE_NAMES.DOCUMENTS, { connection });
export const exportsQueue = new Queue(QUEUE_NAMES.EXPORTS, { connection });
