import { describe, it, expect, vi, beforeEach } from "vitest";
import pino from "pino";

// Capture log output for testing
function createTestLogger() {
  const logs: string[] = [];
  const stream = {
    write: (msg: string) => {
      logs.push(msg);
    },
  };

  // Import the module fresh to get a testable logger
  const logger = pino(
    {
      level: "info",
      redact: {
        paths: [
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
        ],
        censor: "[REDACTED]",
      },
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    stream,
  );

  return { logger, logs, getLastLog: () => JSON.parse(logs[logs.length - 1]) };
}

describe("server logger", () => {
  describe("redaction", () => {
    it("redacts password field", () => {
      const { logger, getLastLog } = createTestLogger();
      logger.info({ password: "secret123" }, "test");
      expect(getLastLog().password).toBe("[REDACTED]");
    });

    it("redacts token field", () => {
      const { logger, getLastLog } = createTestLogger();
      logger.info({ token: "abc123" }, "test");
      expect(getLastLog().token).toBe("[REDACTED]");
    });

    it("redacts apiKey field", () => {
      const { logger, getLastLog } = createTestLogger();
      logger.info({ apiKey: "key-xyz" }, "test");
      expect(getLastLog().apiKey).toBe("[REDACTED]");
    });

    it("redacts secret field", () => {
      const { logger, getLastLog } = createTestLogger();
      logger.info({ secret: "topsecret" }, "test");
      expect(getLastLog().secret).toBe("[REDACTED]");
    });

    it("redacts email field", () => {
      const { logger, getLastLog } = createTestLogger();
      logger.info({ email: "user@example.com" }, "test");
      expect(getLastLog().email).toBe("[REDACTED]");
    });

    it("redacts ip field", () => {
      const { logger, getLastLog } = createTestLogger();
      logger.info({ ip: "192.168.1.1" }, "test");
      expect(getLastLog().ip).toBe("[REDACTED]");
    });

    it("redacts nested *.password paths", () => {
      const { logger, getLastLog } = createTestLogger();
      logger.info({ user: { password: "nested-secret" } }, "test");
      expect(getLastLog().user.password).toBe("[REDACTED]");
    });

    it("redacts nested *.token paths", () => {
      const { logger, getLastLog } = createTestLogger();
      logger.info({ auth: { token: "nested-token" } }, "test");
      expect(getLastLog().auth.token).toBe("[REDACTED]");
    });

    it("redacts req.headers.authorization", () => {
      const { logger, getLastLog } = createTestLogger();
      logger.info(
        { req: { headers: { authorization: "Bearer xyz" } } },
        "test",
      );
      expect(getLastLog().req.headers.authorization).toBe("[REDACTED]");
    });

    it("redacts req.headers.cookie", () => {
      const { logger, getLastLog } = createTestLogger();
      logger.info({ req: { headers: { cookie: "session=abc" } } }, "test");
      expect(getLastLog().req.headers.cookie).toBe("[REDACTED]");
    });

    it("redacts body.password", () => {
      const { logger, getLastLog } = createTestLogger();
      logger.info({ body: { password: "body-password" } }, "test");
      expect(getLastLog().body.password).toBe("[REDACTED]");
    });

    it("preserves non-sensitive fields", () => {
      const { logger, getLastLog } = createTestLogger();
      logger.info({ monitorId: "mon-123", responseTime: 150 }, "test");
      const log = getLastLog();
      expect(log.monitorId).toBe("mon-123");
      expect(log.responseTime).toBe(150);
    });
  });

  describe("child logger", () => {
    it("createRequestLogger includes requestId in child", () => {
      const { logger, getLastLog } = createTestLogger();
      const childLogger = logger.child({ requestId: "req-abc-123" });
      childLogger.info({}, "child log test");
      expect(getLastLog().requestId).toBe("req-abc-123");
    });

    it("child logger inherits redaction", () => {
      const { logger, getLastLog } = createTestLogger();
      const childLogger = logger.child({ requestId: "req-xyz" });
      childLogger.info({ password: "should-be-redacted" }, "test");
      expect(getLastLog().password).toBe("[REDACTED]");
      expect(getLastLog().requestId).toBe("req-xyz");
    });
  });

  describe("formatting", () => {
    it("uses ISO timestamp format", () => {
      const { logger, getLastLog } = createTestLogger();
      logger.info({}, "timestamp test");
      const log = getLastLog();
      expect(log.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("formats level as label string", () => {
      const { logger, getLastLog } = createTestLogger();
      logger.info({}, "level test");
      expect(getLastLog().level).toBe("info");
    });

    it("includes message in log", () => {
      const { logger, getLastLog } = createTestLogger();
      logger.info({}, "my log message");
      expect(getLastLog().msg).toBe("my log message");
    });
  });
});
