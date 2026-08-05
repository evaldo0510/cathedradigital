import * as Sentry from "@sentry/react";

export const initSentry = () => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
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
      beforeSend(event, hint) {
        // Capturar erros de carregamento de chunk (comum em falhas de dependência/deploy)
        const error = hint.originalException;
        if (error && error.toString().includes('Loading chunk')) {
          event.level = 'fatal';
          event.tags = { ...event.tags, error_type: 'chunk_load_failure' };
        }
        return event;
      },
    });
  }
};

export const setSentryUser = (user: { id: string; email?: string } | null) => {
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email });
  } else {
    Sentry.setUser(null);
  }
};

