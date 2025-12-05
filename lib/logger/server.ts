import pino from "pino";

// Explicit redaction paths per SEC2
const REDACT_PATHS = [
  "password",
  "token",
  "apiKey",
  "secret",
  "email",
  "ip",
  "*.password",
  "*.token",
  "*.apiKey",
  "*.secret",
  "req.headers.authorization",
  "req.headers.cookie",
  "body.password",
  "body.token",
  "body.apiKey",
];

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",

  // Redact sensitive fields
  redact: {
    paths: REDACT_PATHS,
    censor: "[REDACTED]",
  },

  // Vercel-optimized JSON output
  formatters: {
    level: (label) => ({ level: label }),
  },

  // Add timestamp as ISO string
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Create request-scoped logger with correlation ID
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

// Type-safe log context
export type LogContext = Record<string, unknown>;
