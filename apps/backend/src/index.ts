import { env } from "./config/env.js"; // Must be first
import express from "express";
import cors from "cors";
import { logger } from "./config/logger.js";
import { prisma } from "./config/prisma.js";
import { requestLoggerMiddleware } from "./middleware/request-logger.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import apiRouter from "./routes/index.js";
import { instrumentService } from "./services/instrument.service.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLoggerMiddleware);

// Mount API routes
app.use("/api", apiRouter);

// Global catch-all error handling middleware
app.use(errorMiddleware);

const server = app.listen(env.PORT, () => {
  logger.info(
    `Backend server successfully running in [${env.NODE_ENV}] mode on port ${env.PORT}`,
  );
  instrumentService.initialize().catch((err) => {
    logger.error("Failed to pre-load daily instruments:", err);
  });
});

// Graceful Shutdown handler
const shutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  // Close server to reject new incoming connections
  server.close(async () => {
    logger.info("HTTP server closed.");
    try {
      await prisma.$disconnect();
      logger.info("Prisma Database client disconnected.");
      process.exit(0);
    } catch (error) {
      logger.error("Error during graceful database disconnection:", error);
      process.exit(1);
    }
  });

  // Enforce absolute timeout for connection close
  setTimeout(() => {
    logger.error("Graceful shutdown timeout exceeded, forcing exit");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", () => {
  shutdown("SIGTERM").catch((err) => {
    logger.error("SIGTERM handler caught error", err);
    process.exit(1);
  });
});

process.on("SIGINT", () => {
  shutdown("SIGINT").catch((err) => {
    logger.error("SIGINT handler caught error", err);
    process.exit(1);
  });
});
