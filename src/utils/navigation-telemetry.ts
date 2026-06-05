type LogLevel = 'info' | 'warn' | 'error';

interface TelemetryEvent {
  type: string;
  timestamp: string;
  route: string;
  details?: Record<string, any>;
}

class NavigationTelemetry {
  private static instance: NavigationTelemetry;
  private logs: TelemetryEvent[] = [];
  private readonly MAX_LOGS = 100;

  private constructor() {
    // Escuta eventos customizados de navegação bloqueada
    if (typeof window !== 'undefined') {
      window.addEventListener('nav-blocked', (e: any) => {
        this.log('Navigation Blocked', 'warn', e.detail);
      });
      window.addEventListener('swipe-detected', (e: any) => {
        this.log('Swipe Detected', 'info', e.detail);
      });
    }
  }

  static getInstance(): NavigationTelemetry {
    if (!NavigationTelemetry.instance) {
      NavigationTelemetry.instance = new NavigationTelemetry();
    }
    return NavigationTelemetry.instance;
  }

  log(type: string, level: LogLevel = 'info', details?: Record<string, any>) {
    const event: TelemetryEvent = {
      type,
      timestamp: new Date().toISOString(),
      route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      details,
    };

    this.logs.unshift(event);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.pop();
    }

    const color = level === 'error' ? 'red' : level === 'warn' ? 'orange' : 'cyan';
    console.log(
      `%c[Telemetry] ${type}%c at ${event.route}`,
      `color: ${color}; font-weight: bold;`,
      'color: inherit;',
      details || ''
    );
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const telemetry = NavigationTelemetry.getInstance();
