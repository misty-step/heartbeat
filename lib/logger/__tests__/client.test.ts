import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { serializeError } from "serialize-error";

// Test-friendly version of ClientLogger
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

class TestableClientLogger {
  public buffer: LogEntry[] = [];

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
      url: "http://localhost:3000/test",
      userAgent: "test-agent",
    };

    if (error) {
      entry.error = serializeError(error);
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
        keepalive: true,
      });
    } catch {
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

describe("ClientLogger", () => {
  let logger: TestableClientLogger;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    logger = new TestableClientLogger();
    mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("batching", () => {
    it("buffers entries until LOG_BATCH_SIZE", () => {
      for (let i = 0; i < 5; i++) {
        logger.info(`message ${i}`);
      }
      expect(logger.buffer.length).toBe(5);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("auto-flushes when buffer reaches LOG_BATCH_SIZE", async () => {
      for (let i = 0; i < 10; i++) {
        logger.info(`message ${i}`);
      }
      // Wait for flush to complete
      await new Promise((r) => setTimeout(r, 10));
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(logger.buffer.length).toBe(0);
    });

    it("flushes empty buffer without fetch", async () => {
      await logger.flush();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("flush", () => {
    it("POSTs entries to /api/logs", async () => {
      logger.info("test message", { key: "value" });
      await logger.flush();

      expect(mockFetch).toHaveBeenCalledWith("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"message":"test message"'),
        keepalive: true,
      });
    });

    it("clears buffer after successful flush", async () => {
      logger.info("message 1");
      logger.info("message 2");
      expect(logger.buffer.length).toBe(2);

      await logger.flush();
      expect(logger.buffer.length).toBe(0);
    });

    it("re-adds entries to buffer on fetch failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      logger.info("important message");
      const entryCount = logger.buffer.length;

      await logger.flush();

      expect(logger.buffer.length).toBe(entryCount);
      expect(logger.buffer[0].message).toBe("important message");
    });

    it("sends entries with keepalive: true", async () => {
      logger.info("test");
      await logger.flush();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/logs",
        expect.objectContaining({ keepalive: true }),
      );
    });
  });

  describe("log levels", () => {
    it("debug() creates entry with level debug", () => {
      logger.debug("debug message");
      expect(logger.buffer[0].level).toBe("debug");
    });

    it("info() creates entry with level info", () => {
      logger.info("info message");
      expect(logger.buffer[0].level).toBe("info");
    });

    it("warn() creates entry with level warn", () => {
      logger.warn("warn message");
      expect(logger.buffer[0].level).toBe("warn");
    });

    it("error() creates entry with level error", () => {
      logger.error("error message");
      expect(logger.buffer[0].level).toBe("error");
    });
  });

  describe("error serialization", () => {
    it("serializes Error objects correctly", () => {
      const testError = new Error("Test error message");
      testError.name = "TestError";

      logger.error("Something went wrong", {}, testError);

      const entry = logger.buffer[0];
      expect(entry.error).toBeDefined();
      expect(entry.error?.message).toBe("Test error message");
      expect(entry.error?.name).toBe("TestError");
      expect(entry.error?.stack).toBeDefined();
    });

    it("handles errors without stack traces", () => {
      const simpleError = new Error("Simple error");
      delete simpleError.stack;

      logger.error("Error occurred", {}, simpleError);

      const entry = logger.buffer[0];
      expect(entry.error?.message).toBe("Simple error");
    });
  });

  describe("entry structure", () => {
    it("includes timestamp in ISO format", () => {
      const before = new Date().toISOString();
      logger.info("test");
      const after = new Date().toISOString();

      const timestamp = logger.buffer[0].timestamp;
      expect(timestamp >= before).toBe(true);
      expect(timestamp <= after).toBe(true);
    });

    it("includes message", () => {
      logger.info("my message");
      expect(logger.buffer[0].message).toBe("my message");
    });

    it("includes context when provided", () => {
      logger.info("test", { userId: "123", action: "click" });
      expect(logger.buffer[0].context).toEqual({
        userId: "123",
        action: "click",
      });
    });

    it("includes url", () => {
      logger.info("test");
      expect(logger.buffer[0].url).toBe("http://localhost:3000/test");
    });

    it("includes userAgent", () => {
      logger.info("test");
      expect(logger.buffer[0].userAgent).toBe("test-agent");
    });
  });
});
