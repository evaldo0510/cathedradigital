import { useEffect, useRef } from 'react';

/**
 * Lightweight render performance probe.
 *
 * Padronizado para coletar APENAS o essencial:
 *  - contagem de renders
 *  - duração da montagem até o primeiro effect
 *
 * Em produção é praticamente um no-op (sem PerformanceObserver, sem inserts
 * no banco, sem breadcrumbs Sentry por render). Isso evita re-renders e
 * escrita excessiva de logs durante a navegação.
 *
 * Para habilitar amostragem mínima em produção, defina
 * `window.__PERF_SAMPLE__ = 0.05` (5%) via console ou flag.
 */
export function useRenderPerf(componentName: string, _threshold = 5) {
  const renderCount = useRef(0);
  const mountedAt = useRef<number>(0);
  renderCount.current++;

  useEffect(() => {
    mountedAt.current = performance.now();

    return () => {
      if (!import.meta.env.DEV) {
        const sample = (globalThis as any).__PERF_SAMPLE__ ?? 0;
        if (Math.random() > sample) return;
      }
      const duration = performance.now() - mountedAt.current;
      // Single, cheap log line. No table, no group, no network.
      // eslint-disable-next-line no-console
      console.debug(
        `[perf] ${componentName} renders=${renderCount.current} dur=${duration.toFixed(0)}ms`
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentName]);
}
