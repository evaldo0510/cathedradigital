
import { trackEvent } from './analytics';
import { supabase } from '@/integrations/supabase/client';

const redactPII = (text: string) => {
  if (!text) return text;
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
    .replace(/eyJhbGciOiJIUzI1NiJ9\.[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+/g, '[JWT_REDACTED]');
};

export type TelemetryEvent = {
  timestamp: number;
  type: 'effect_trigger' | 'request' | 'error' | 'navigation_error' | 'alert' | 'config_change' | 'export';
  responseTime?: number;
  component?: string;
  endpoint?: string;
  severity?: 'info' | 'warning' | 'critical';
  metadata?: any;
};

export type ThresholdConfig = {
  errorRate: number; // %
  avgLatency: number; // ms
  effectTriggers: number; // per minute
};

class Telemetry {
  private static events: TelemetryEvent[] = [];
  private static listeners: ((events: TelemetryEvent[]) => void)[] = [];
  private static thresholds: ThresholdConfig = {
    errorRate: 10,
    avgLatency: 500,
    effectTriggers: 50
  };
  private static isInitialized = false;

  static async init() {
    if (this.isInitialized) return;
    try {
      const { data, error } = await supabase
        .from('telemetry_settings')
        .select('value')
        .eq('key', 'thresholds')
        .single();
      
      if (!error && data?.value) {
        this.thresholds = data.value as ThresholdConfig;
      }
    } catch (e) {
      console.error('[Telemetry] Failed to load thresholds from DB', e);
    }
    this.isInitialized = true;
  }

  static async setThresholds(config: Partial<ThresholdConfig>) {
    const oldThresholds = { ...this.thresholds };
    this.thresholds = { ...this.thresholds, ...config };
    
    try {
      await supabase
        .from('telemetry_settings')
        .upsert({ 
          key: 'thresholds', 
          value: this.thresholds,
          updated_at: new Date().toISOString()
        });
      
      this.audit('config_change', 'Alteração de Limiares', {
        old: oldThresholds,
        new: this.thresholds
      }, 'info');
    } catch (e) {
      console.error('[Telemetry] Failed to save thresholds', e);
    }
    this.notify();
  }

  static getThresholds() {
    return { ...this.thresholds };
  }

  static log(event: Omit<TelemetryEvent, 'timestamp'>) {
    const newEvent = { ...event, timestamp: Date.now() };
    this.events.push(newEvent);
    
    if (this.events.length > 2000) {
      this.events.shift();
    }
    
    this.notify();
    this.checkThresholds();
    
    if (event.type === 'error' || event.type === 'navigation_error') {
      console.error(`[Telemetry] ${event.type} in ${event.component || 'Global'}`, event.metadata);
    }
  }

  private static checkThresholds() {
    const summary = this.getMetricsSummary();
    const thresholds = this.thresholds;
    
    if (summary.errorRate > thresholds.errorRate) {
      this.triggerAlert('Taxa de erros elevada', `Atual: ${summary.errorRate.toFixed(1)}% (Limite: ${thresholds.errorRate}%)`, 'critical');
    }
    
    if (summary.avgResponseTime > thresholds.avgLatency) {
      this.triggerAlert('Latência média elevada', `Atual: ${Math.round(summary.avgResponseTime)}ms (Limite: ${thresholds.avgLatency}ms)`, 'warning');
    }

    if (summary.effectTriggers > thresholds.effectTriggers) {
      this.triggerAlert('Excesso de useEffect triggers', `Atual: ${summary.effectTriggers}pm (Limite: ${thresholds.effectTriggers}pm)`, 'warning');
    }
  }

  private static triggerAlert(title: string, message: string, severity: 'warning' | 'critical') {
    const recentAlerts = this.events.filter(e => 
      e.type === 'alert' && 
      e.metadata?.title === title && 
      (Date.now() - e.timestamp) < 300000 // 5 minutos de cooldown
    );
    
    if (recentAlerts.length > 0) return;

    this.log({
      type: 'alert',
      severity,
      metadata: { title, message }
    });

    this.audit('alert', title, { message, severity }, severity);
  }

  static async audit(eventType: string, title: string, details: any, severity: string = 'info') {
    try {
      await supabase.from('telemetry_audit').insert({
        event_type: eventType,
        title,
        details,
        severity,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('[Telemetry] Audit failed', e);
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

export const trackNavigationError = (error: Error, context?: Record<string, any>) => {
  const errorId = `err_${Math.random().toString(36).substr(2, 9)}`;
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

  trackEvent('error', {
    errorId,
    message: safeMessage,
    ...safeContext
  });

  return errorId;
};

// Initialize telemetry thresholds
Telemetry.init();

export default Telemetry;