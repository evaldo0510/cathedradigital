import { useMemo } from 'react';

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  strokeClass?: string;
  fillClass?: string;
  ariaLabel?: string;
}

/**
 * Minimalist SVG sparkline, no external dep.
 * Renders a smooth polyline of `values`, scaled to the given box.
 */
export function Sparkline({
  values,
  width = 88,
  height = 20,
  strokeClass = 'stroke-primary',
  fillClass = 'fill-primary/10',
  ariaLabel,
}: SparklineProps) {
  const { path, areaPath, lastY, empty } = useMemo(() => {
    if (!values || values.length === 0) {
      return { path: '', areaPath: '', lastY: 0, empty: true };
    }
    const n = values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = 1.5;
    const w = width - pad * 2;
    const h = height - pad * 2;
    const range = max - min || 1;
    const step = n > 1 ? w / (n - 1) : 0;
    const pts = values.map((v, i) => {
      const x = pad + (n === 1 ? w / 2 : i * step);
      const y = pad + h - ((v - min) / range) * h;
      return [x, y] as const;
    });
    const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const area = `${d} L${pts[pts.length - 1][0].toFixed(1)},${(pad + h).toFixed(1)} L${pts[0][0].toFixed(1)},${(pad + h).toFixed(1)} Z`;
    return { path: d, areaPath: area, lastY: pts[pts.length - 1][1], empty: false };
  }, [values, width, height]);

  if (empty) {
    return (
      <svg width={width} height={height} className="text-muted-foreground/30" aria-label={ariaLabel}>
        <line x1={2} y1={height / 2} x2={width - 2} y2={height / 2}
          strokeDasharray="2 2" className="stroke-current" />
      </svg>
    );
  }

  return (
    <svg width={width} height={height} role="img" aria-label={ariaLabel}>
      <path d={areaPath} className={fillClass} />
      <path d={path} fill="none" strokeWidth={1.2} className={strokeClass} />
      <circle cx={width - 1.5} cy={lastY} r={1.6} className={strokeClass.replace('stroke-', 'fill-')} />
    </svg>
  );
}
