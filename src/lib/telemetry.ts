
type TelemetryEvent = {
  timestamp: number;
  type: 'effect_trigger' | 'request' | 'error';
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
    if (event.type === 'error') {
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
    const errors = minuteEvents.filter(e => e.type === 'error').length;
    
    const requestEvents = minuteEvents.filter(e => e.type === 'request' && e.responseTime !== undefined);
    const avgResponseTime = requestEvents.length > 0 
      ? requestEvents.reduce((acc, e) => acc + (e.responseTime || 0), 0) / requestEvents.length 
      : 0;
      
    return {
      effectTriggers,
      totalRequests,
      errors,
      avgResponseTime,
      errorRate: totalRequests > 0 ? (errors / totalRequests) * 100 : 0
    };
  }
}

export default Telemetry;
