import * as Sentry from "@sentry/react";

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN || "";

  if (dsn) {
    Sentry.init({
      dsn,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: 1.0, 
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      
      environment: import.meta.env.MODE,

      beforeSend(event) {
        // Ensure stack traces are captured for all errors
        return event;
      },
      
      // Filter out common noise
      ignoreErrors: [
        "ResizeObserver loop limit exceeded",
        "Non-Error promise rejection captured",
      ],
    });
  } else {
    // In dev, we can still use Sentry wrapper components if needed
    // or just log to console
    console.log("Sentry DSN not found. Error tracking disabled.");
  }
};

export const captureException = (error: any, context?: any) => {
  console.error("Capturing error in Sentry:", error, context);
  Sentry.captureException(error, { extra: context });
};

export const setSentryUser = (user: { id: string; email?: string } | null) => {
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email });
  } else {
    Sentry.setUser(null);
  }
};
