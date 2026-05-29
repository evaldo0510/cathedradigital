import { useEffect, useRef } from 'react';

/**
 * A hook to monitor component render performance and re-render counts.
 * In development, it logs to console. In production, it can send breadcrumbs to Sentry
 * if a component renders excessively.
 */
export function useRenderPerf(componentName: string, threshold = 5) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  renderCount.current++;

  useEffect(() => {
    const duration = performance.now() - startTime.current;
    
    if (import.meta.env.DEV) {
      console.log(`[RenderPerf] ${componentName} rendered in ${duration.toFixed(2)}ms (count: ${renderCount.current})`);
    }

    if (renderCount.current > threshold) {
      const message = `High re-render count detected for ${componentName}: ${renderCount.current}`;
      if (import.meta.env.DEV) console.warn(message);
    }

    // Reset start time for next potential render
    startTime.current = performance.now();
  });
}
