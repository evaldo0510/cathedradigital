
import { trackEvent } from './analytics';

const redactPII = (text: string) => {
  if (!text) return text;
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
    .replace(/eyJhbGciOiJIUzI1NiJ9\.[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+/g, '[JWT_REDACTED]');
};

export type TelemetryEvent = {
  timestamp: number;
  type: 'effect_trigger' | 'request' | 'error' | 'navigation_error';
  responseTime?: number;
  component?: string;
  metadata?: any;
};

class Telemetry {
  private static events: TelemetryEvent[] = [];
  private static listeners: ((events: TelemetryEvent[]) => void)[] = [];

  static log(event: Omit<TelemetryEvent, 'timestamp'>) {
    const newEvent = { ...event, timestamp: Date.now() };
    this.events.push(newEvent);
    
    // Manter apenas os últimos 1000 eventos para não sobrecarregar a memória
    if (this.events.length > 1000) {
      this.events.shift();
    }
    
    this.notify();
    
    // Também log no console para debug se necessário
    if (event.type === 'error' || event.type === 'navigation_error') {
      console.error(`[Telemetry] ${event.type} in ${event.component}`, event.metadata);
    }
  }

  static getEvents() {
    return [...this.events];
  }

  static subscribe(callback: (events: TelemetryEvent[]) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private static notify() {
    // Usar um pequeno debounce ou requestAnimationFrame para evitar re-renders excessivos
    if (this.listeners.length > 0) {
      const currentEvents = [...this.events];
      this.listeners.forEach(l => l(currentEvents));
    }
  }
  
  static getMetricsSummary() {
    const now = Date.now();
    const lastMinute = now - 60000;
    const minuteEvents = this.events.filter(e => e.timestamp > lastMinute);
    
    const effectTriggers = minuteEvents.filter(e => e.type === 'effect_trigger').length;
    const totalRequests = minuteEvents.filter(e => e.type === 'request').length;
    const errors = minuteEvents.filter(e => e.type === 'error' || e.type === 'navigation_error').length;
    
    const requestEvents = minuteEvents.filter(e => e.type === 'request' && e.responseTime !== undefined);
    const avgResponseTime = requestEvents.length > 0 
      ? requestEvents.reduce((acc, e) => acc + (e.responseTime || 0), 0) / requestEvents.length 
      : 0;
      
    return {
      effectTriggers,
      totalRequests,
      errors,
      avgResponseTime,
      errorRate: totalRequests > 0 ? (errors / (totalRequests + errors)) * 100 : 0
    };
  }
}

/**
 * Função exportada para manter compatibilidade com componentes existentes
 */
export const trackNavigationError = (error: Error, context?: Record<string, any>) => {
  const errorId = `err_${Math.random().toString(36).substr(2, 9)}`;
  
  // Redigir PII da mensagem de erro
  const safeMessage = redactPII(error.message);
  const safeContext = context ? JSON.parse(redactPII(JSON.stringify(context))) : undefined;

  Telemetry.log({
    type: 'navigation_error',
    component: context?.componentStack ? 'Error Boundary' : 'Navigation',
    metadata: {
      errorId,
      message: safeMessage,
      ...safeContext
    }
  });

  // Integrar com o analytics existente
  trackEvent('error', {
    errorId,
    message: safeMessage,
    ...safeContext
  });

  return errorId;
};

export default Telemetry;
