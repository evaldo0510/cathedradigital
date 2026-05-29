import { useEffect, useState, useCallback } from 'react';

export interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  memoryUsage?: number;
  bundleSize?: number; // Estimated
}

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    renderTime: 0,
  });

  const [fpsCount, setFpsCount] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const checkFps = () => {
      const now = performance.now();
      frameCount++;

      if (now >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        setMetrics(prev => ({
          ...prev,
          fps,
          memoryUsage: (performance as any).memory?.usedJSHeapSize / (1024 * 1024),
        }));
        frameCount = 0;
        lastTime = now;
      }

      rafId = requestAnimationFrame(checkFps);
    };

    rafId = requestAnimationFrame(checkFps);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const reportRenderTime = useCallback((time: number) => {
    setMetrics(prev => ({ ...prev, renderTime: time }));
  }, []);

  return { metrics, reportRenderTime };
}
