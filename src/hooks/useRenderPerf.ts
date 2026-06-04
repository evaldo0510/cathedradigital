import { useEffect, useRef } from 'react';
import * as Sentry from "@sentry/react";
import { onCLS, onINP, onLCP, onFCP } from 'web-vitals';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * A hook to monitor component render performance and re-render counts.
 * Also measures CLS, INP, and LCP for performance regression tracking.
 */
export function useRenderPerf(componentName: string, threshold = 5) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());
  const location = useLocation();
  const metrics = useRef({
    cls: 0,
    inp: 0,
    lcp: 0,
    fcp: 0,
    tbt: 0
  });

  renderCount.current++;

  useEffect(() => {
    // Track Web Vitals
    onCLS((metric) => {
      metrics.current.cls = metric.value;
    });
    onINP((metric) => {
      metrics.current.inp = metric.value;
    });
    onLCP((metric) => {
      metrics.current.lcp = metric.value;
    });
    onFCP((metric) => {
      metrics.current.fcp = metric.value;
    });

    // Measure TBT (Estimated from Long Tasks during session)
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          metrics.current.tbt += (entry.duration - 50);
        }
      }
    });

    try {
      observer.observe({ type: 'longtask', buffered: true });
    } catch (e) {
      // Browser might not support longtask
    }

    return () => {
      observer.disconnect();

      const duration = performance.now() - startTime.current;
      const route = location.pathname;
      
      const report = {
        component: componentName,
        route,
        duration: `${duration.toFixed(2)}ms`,
        renders: renderCount.current,
        cls: metrics.current.cls.toFixed(4),
        inp: `${metrics.current.inp.toFixed(2)}ms`,
        lcp: `${metrics.current.lcp.toFixed(2)}ms`,
        tbt: `${metrics.current.tbt.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      };

      if (import.meta.env.DEV) {
        console.group(`[Perf Audit] ${componentName} @ ${route}`);
        console.table(report);
        console.groupEnd();
      }

      // Record performance event in audit trail
      supabase.from('app_metrics').insert([{
        metric_type: 'performance_event',
        metadata: report
      }]).then(() => {}, (err) => console.error("Perf Logging Error", err));

      // Log to Sentry if metrics exceed thresholds
      if (metrics.current.cls > 0.1 || metrics.current.inp > 200 || renderCount.current > threshold) {
        Sentry.addBreadcrumb({
          category: 'performance_audit',
          message: `Perf Regression in ${componentName}`,
          level: 'warning',
          data: report
        });
      }
    };
  }, [componentName, threshold, location.pathname]);

  useEffect(() => {
    startTime.current = performance.now();
  });
}
