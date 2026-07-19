import { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";

export const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "info" },
    { emit: "event", level: "warn" },
    { emit: "event", level: "error" },
  ],
});

// Since the Prisma event handlers receive structured objects, we cast them type-safely.
prisma.$on(
  "query" as never,
  (e: { query: string; params: string; duration: number }) => {
    logger.debug(
      `Prisma Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`,
    );
  },
);

prisma.$on("info" as never, (e: { message: string }) => {
  logger.info(`Prisma Info: ${e.message}`);
});

prisma.$on("warn" as never, (e: { message: string }) => {
  logger.warn(`Prisma Warning: ${e.message}`);
});

prisma.$on("error" as never, (e: { message: string }) => {
  logger.error(`Prisma Error: ${e.message}`);
});
