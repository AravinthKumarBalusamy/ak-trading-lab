import winston from "winston";
import { env } from "./env.js";

const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "apikey",
  "kite_api_secret",
  "jwt_secret",
];

const sanitizeObject = (obj: unknown): unknown => {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const record = obj as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  for (const key of Object.keys(record)) {
    const value = record[key];
    if (value && typeof value === "object") {
      sanitized[key] = sanitizeObject(value);
    } else if (
      SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive))
    ) {
      sanitized[key] = "[MASKED]";
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

const sanitizeFormat = winston.format((info) => {
  if (info.metadata) {
    info.metadata = sanitizeObject(info.metadata);
  }
  const rawInfo = info as Record<string, unknown>;
  if (rawInfo.meta) {
    rawInfo.meta = sanitizeObject(rawInfo.meta);
  }
  return info;
});

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.metadata({ fillWith: ["timestamp", "level", "message"] }),
  sanitizeFormat(),
);

const localFormat = winston.format.printf(({ level, message, metadata }) => {
  const metaObj = metadata as Record<string, unknown>;
  const timestamp =
    typeof metaObj.timestamp === "string"
      ? metaObj.timestamp
      : new Date().toISOString();

  // Clean up timestamp, level, message from showing up inside metadata output
  const cleanMeta = { ...metaObj };
  delete cleanMeta.timestamp;
  delete cleanMeta.level;
  delete cleanMeta.message;

  const metaStr = Object.keys(cleanMeta).length
    ? ` ${JSON.stringify(cleanMeta)}`
    : "";
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
});

const transports: winston.transport[] = [];

if (env.NODE_ENV === "production") {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(logFormat, winston.format.json()),
    }),
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        logFormat,
        winston.format.colorize(),
        localFormat,
      ),
    }),
  );
}

export const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transports,
});
