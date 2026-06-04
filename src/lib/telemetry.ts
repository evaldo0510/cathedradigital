import { trackEvent } from './analytics';

/**
 * Filtra dados sensíveis de objetos de metadados
 * Mascara emails, senhas e tokens antes do envio
 */
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
    } else if (key === 'stack' || key === 'message') {
      // Regex para remover padrões comuns de PII (emails e tokens) de strings de texto
      masked[key] = masked[key]
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
        .replace(/ey[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, '[JWT_REDACTED]');
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
  
  // Tag específica para erros de navegação/UI para facilitar filtros no admin
  const isTypeError = error instanceof TypeError;
  const errorType = isTypeError ? 'type_error' : 'navigation_error';

  console.error(`[${errorType.toUpperCase()}] ID: ${requestId}, Route: ${route}`, error, safeContext);
  
  trackEvent('error', {
    type: errorType,
    requestId,
    route,
    message: error.message,
    stack: error.stack,
    isMobile: window.innerWidth < 1024,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
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
