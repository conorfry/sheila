import pino from "pino";

export const logger = pino({
  name: "sheila-worker",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty" }
      : undefined,
});
