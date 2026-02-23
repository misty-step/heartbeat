import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  sendDefaultPii: false,

  // Session replay for visual debugging
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      maskAllInputs: true, // Prevent PII leakage from form inputs
      blockAllMedia: false,
    }),
  ],

  // Filter out browser extension noise
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Ignore browser extension errors
    if (typeof error === "object" && error !== null) {
      const errorString = String(error);
      if (
        errorString.includes("extension://") ||
        errorString.includes("chrome-extension://")
      ) {
        return null;
      }
    }

    // Ignore ResizeObserver loop errors (benign)
    if (event.message?.includes("ResizeObserver loop")) {
      return null;
    }

    return event;
  },
});
