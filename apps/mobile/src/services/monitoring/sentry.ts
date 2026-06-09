const SENTRY_DSN = process.env.SENTRY_DSN || '';

let Sentry: any = null;

export function initSentry(): void {
  if (!SENTRY_DSN) return;

  try {
    Sentry = require('@sentry/react-native');
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.2,
      enableAutoSessionTracking: true,
      attachStacktrace: true,
      beforeSend(event: any) {
        if (event.request?.headers) {
          delete event.request.headers['Authorization'];
        }
        return event;
      },
    });
  } catch {
    // @sentry/react-native not installed
  }
}

export function setUser(userId: string, email?: string): void {
  if (!Sentry) return;
  Sentry.setUser({ id: userId, email });
}

export function clearUser(): void {
  if (!Sentry) return;
  Sentry.setUser(null);
}

export function captureException(error: Error, context?: Record<string, any>): void {
  if (!Sentry) return;
  if (context) {
    Sentry.withScope((scope: any) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

export function addBreadcrumb(
  category: string,
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
): void {
  if (!Sentry) return;
  Sentry.addBreadcrumb({ category, message, level });
}
