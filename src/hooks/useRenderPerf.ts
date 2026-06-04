import { useEffect, useRef } from 'react';
import * as Sentry from "@sentry/react";

/**
 * A hook to monitor component render performance and re-render counts.
 * Also measures CLS and transition stability.
 */
export function useRenderPerf(componentName: string, threshold = 5) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());
  const clsValue = useRef(0);

  renderCount.current++;

  useEffect(() => {
    // CLS Measurement (Simplified Web Vitals)
    let cls = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      }
      clsValue.current = cls;
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    return () => {
      observer.disconnect();
      const duration = performance.now() - startTime.current;
      
      if (import.meta.env.DEV) {
        console.log(`[Perf] ${componentName}: ${duration.toFixed(2)}ms, CLS: ${clsValue.current.toFixed(4)}, Renders: ${renderCount.current}`);
      }

      if (clsValue.current > 0.1 || renderCount.current > threshold) {
        Sentry.addBreadcrumb({
          category: 'performance',
          message: `${componentName} Metrics: CLS=${clsValue.current.toFixed(4)}, Renders=${renderCount.current}`,
          level: 'warning',
          data: { componentName, renderCount: renderCount.current, duration, cls: clsValue.current }
        });
      }
    };
  }, [componentName, threshold]);

  useEffect(() => {
    startTime.current = performance.now();
  });
}

