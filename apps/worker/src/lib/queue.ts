import { Queue } from "bullmq";
import { QUEUE_NAMES } from "@sheila/shared/constants";

const redisUrl = new URL(process.env.REDIS_URL || "redis://localhost:6379");

const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
};

export const documentsQueue = new Queue(QUEUE_NAMES.DOCUMENTS, { connection });
export const exportsQueue = new Queue(QUEUE_NAMES.EXPORTS, { connection });

export { connection };
