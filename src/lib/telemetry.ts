import { trackEvent } from './analytics';

/**
 * Filtra dados sensíveis de objetos de metadados
 * Mascara emails, senhas e tokens antes do envio
 */
const maskSensitiveData = (data: Record<string, any>) => {
  const masked = { ...data };
  const sensitiveKeys = ['email', 'password', 'token', 'auth', 'secret', 'key'];
  
  Object.keys(masked).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      masked[key] = '***MASKED***';
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
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
