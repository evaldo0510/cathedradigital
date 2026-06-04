import { trackEvent } from './analytics';

/**
 * Filtra dados sensíveis de objetos de metadados
 * Mascara emails, senhas, tokens e agora PII em stack traces
 */
const maskSensitiveData = (data: Record<string, any>) => {
  if (typeof data !== 'object' || data === null) return data;
  const masked = { ...data };
  const sensitiveKeys = ['email', 'password', 'token', 'auth', 'secret', 'key', 'address', 'phone'];
  
  Object.keys(masked).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      masked[key] = '***MASKED***';
    } else if (typeof masked[key] === 'string' && (key === 'stack' || key === 'message' || key === 's' || key === 'm')) {
      // Regex para remover padrões comuns de PII (emails e tokens) de strings de texto
      masked[key] = masked[key]
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
        .replace(/ey[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[JWT_REDACTED]');
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  });
  
  return masked;
};

export const trackNavigationError = (error: Error, context?: Record<string, any>) => {
  const requestId = Math.random().toString(36).substring(7);
  const route = window.location.pathname;
  const safeContext = context ? maskSensitiveData(context) : {};
  
  const isTypeError = error instanceof TypeError;
  const errorType = isTypeError ? 'type_error' : 'navigation_error';
  const viewport = `${window.innerWidth}x${window.innerHeight}`;
  const isMobile = window.innerWidth < 1024;

  console.error(`[${errorType.toUpperCase()}] ID: ${requestId}, Route: ${route}`, error, safeContext);
  
  trackEvent('error', {
    type: errorType,
    requestId,
    route,
    message: error.message ? maskSensitiveData({ m: error.message }).m : 'Unknown Error',
    stack: error.stack ? maskSensitiveData({ s: error.stack }).s : null,
    isMobile,
    viewport,
    ...safeContext
  });

  return requestId;
};

export const trackInteraction = (action: string, metadata?: Record<string, any>) => {
  const safeMetadata = metadata ? maskSensitiveData(metadata) : {};
  
  trackEvent('navigation_click', {
    action,
    route: window.location.pathname,
    isMobile: window.innerWidth < 1024,
    ...safeMetadata
  });
};
