import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ClientLogger } from "../client";

describe("ClientLogger", () => {
  let logger: ClientLogger;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock fetch
    mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    // Mock window for beforeunload listener
    const listeners: Record<string, (() => void)[]> = {};
    vi.stubGlobal("window", {
      location: { href: "http://localhost:3000/test" },
      addEventListener: (event: string, handler: () => void) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(handler);
      },
      removeEventListener: vi.fn(),
    });

    // Mock navigator
    vi.stubGlobal("navigator", {
      userAgent: "test-agent",
    });

    // Create logger after mocks are set up
    logger = new ClientLogger();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe("batching", () => {
    it("buffers entries until LOG_BATCH_SIZE (10)", () => {
      for (let i = 0; i < 5; i++) {
        logger.info(`message ${i}`);
      }
      // Buffer should have entries, no flush yet
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("auto-flushes when buffer reaches LOG_BATCH_SIZE", async () => {
      for (let i = 0; i < 10; i++) {
        logger.info(`message ${i}`);
      }
      // Allow the async flush to complete
      await Promise.resolve();
      await Promise.resolve();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("flushes empty buffer without fetch", async () => {
      await logger.flush();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("flushes periodically every 5 seconds", async () => {
      logger.info("message 1");
      expect(mockFetch).not.toHaveBeenCalled();

      // Advance 5 seconds
      await vi.advanceTimersByTimeAsync(5000);
      expect(mockFetch).toHaveBeenCalledTimes(1);
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

      await logger.flush();
      // Second flush should not call fetch (buffer is empty)
      await logger.flush();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("re-adds entries to buffer on fetch failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      logger.info("important message");
      await logger.flush();

      // Buffer should still have the entry
      // Subsequent flush should try again
      mockFetch.mockResolvedValueOnce({ ok: true });
      await logger.flush();
      expect(mockFetch).toHaveBeenCalledTimes(2);
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
    it("debug() creates entry with level debug", async () => {
      logger.debug("debug message");
      await logger.flush();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/logs",
        expect.objectContaining({
          body: expect.stringContaining('"level":"debug"'),
        }),
      );
    });

    it("info() creates entry with level info", async () => {
      logger.info("info message");
      await logger.flush();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/logs",
        expect.objectContaining({
          body: expect.stringContaining('"level":"info"'),
        }),
      );
    });

    it("warn() creates entry with level warn", async () => {
      logger.warn("warn message");
      await logger.flush();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/logs",
        expect.objectContaining({
          body: expect.stringContaining('"level":"warn"'),
        }),
      );
    });

    it("error() creates entry with level error", async () => {
      logger.error("error message");
      await logger.flush();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/logs",
        expect.objectContaining({
          body: expect.stringContaining('"level":"error"'),
        }),
      );
    });
  });

  describe("error serialization", () => {
    it("serializes Error objects correctly", async () => {
      const testError = new Error("Test error message");
      testError.name = "TestError";

      logger.error("Something went wrong", {}, testError);
      await logger.flush();

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      const entry = body.entries[0];

      expect(entry.error).toBeDefined();
      expect(entry.error.message).toBe("Test error message");
      expect(entry.error.name).toBe("TestError");
    });

    it("handles errors without stack traces", async () => {
      const simpleError = new Error("Simple error");
      delete simpleError.stack;

      logger.error("Error occurred", {}, simpleError);
      await logger.flush();

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      const entry = body.entries[0];

      expect(entry.error.message).toBe("Simple error");
    });
  });

  describe("entry structure", () => {
    it("includes timestamp in ISO format", async () => {
      const before = new Date().toISOString();
      logger.info("test");
      const after = new Date().toISOString();

      await logger.flush();

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      const timestamp = body.entries[0].timestamp;

      expect(timestamp >= before).toBe(true);
      expect(timestamp <= after).toBe(true);
    });

    it("includes message", async () => {
      logger.info("my message");
      await logger.flush();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/logs",
        expect.objectContaining({
          body: expect.stringContaining('"message":"my message"'),
        }),
      );
    });

    it("includes context when provided", async () => {
      logger.info("test", { userId: "123", action: "click" });
      await logger.flush();

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      const context = body.entries[0].context;

      expect(context).toEqual({ userId: "123", action: "click" });
    });

    it("includes url from window.location.href", async () => {
      logger.info("test");
      await logger.flush();

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.entries[0].url).toBe("http://localhost:3000/test");
    });

    it("includes userAgent from navigator", async () => {
      logger.info("test");
      await logger.flush();

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.entries[0].userAgent).toBe("test-agent");
    });
  });
});
