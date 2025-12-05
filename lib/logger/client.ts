import { serializeError } from "serialize-error";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: ReturnType<typeof serializeError>;
  url?: string;
  userAgent?: string;
}

const LOG_BATCH_SIZE = 10;
const LOG_FLUSH_INTERVAL = 5000; // 5 seconds

class ClientLogger {
  private buffer: LogEntry[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Flush on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.flush());
      this.startFlushTimer();
    }
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => this.flush(), LOG_FLUSH_INTERVAL);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };

    if (error) {
      entry.error = serializeError(error);
    }

    // Console output for development
    if (process.env.NODE_ENV === "development") {
      const consoleMethod =
        level === "error" ? "error" : level === "warn" ? "warn" : "log";
      console[consoleMethod](
        `[${level.toUpperCase()}]`,
        message,
        context,
        error,
      );
    }

    this.buffer.push(entry);

    if (this.buffer.length >= LOG_BATCH_SIZE) {
      this.flush();
    }
  }

  async flush() {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
        keepalive: true, // Survive page unload
      });
    } catch {
      // Re-add to buffer on failure (will retry on next flush)
      this.buffer.unshift(...entries);
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>, error?: Error) {
    this.log("error", message, context, error);
  }
}

export { ClientLogger };
export const clientLogger = new ClientLogger();
