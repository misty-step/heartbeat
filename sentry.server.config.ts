import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  sendDefaultPii: false,

  // Redact sensitive data from server errors
  beforeSend(event) {
    if (event.request) {
      // Remove auth headers
      if (event.request.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
      // Remove sensitive body fields
      if (event.request.data && typeof event.request.data === "object") {
        const data = event.request.data as Record<string, unknown>;
        delete data.password;
        delete data.token;
        delete data.apiKey;
      }
    }
    return event;
  },
});
