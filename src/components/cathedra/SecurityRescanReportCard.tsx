import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/constants';

interface RescanReport {
  scan_id: string;
  scanned_at: string;
  trigger: string;
  summary: { critical: number; high: number; warn: number; info: number; total: number };
  fixed_findings: { internal_id: string; title: string; resolution: string }[];
  remaining_warnings: { id: string; count: number; level: string; note: string }[];
  ci_gate: { policy: string; thresholds: { critical: number; high: number } };
}

const SecurityRescanReportCard: React.FC = () => {
  const [report, setReport] = useState<RescanReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/security-rescan-report.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setReport)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <Card className="rounded-[2rem] border-destructive/30">
        <CardContent className="p-spacing-lg text-premium-sm text-destructive">
          Falha ao carregar relatório de re-scan: {error}
        </CardContent>
      </Card>
    );
  }
  if (!report) return null;

  const gateBlocked = report.summary.critical > 0 || report.summary.high > 0;

  return (
    <Card className="rounded-[2rem] border-primary/10 shadow-premium overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border/40 flex flex-row items-start justify-between gap-spacing-md">
        <div>
          <CardTitle className="text-premium-lg font-black uppercase tracking-widest flex items-center gap-spacing-xs">
            <Icons.ShieldCheck className="text-primary w-spacing-md h-spacing-md" />
            Relatório de Re-scan
          </CardTitle>
          <CardDescription className="font-serif italic">
            {new Date(report.scanned_at).toLocaleString('pt-BR')} · {report.trigger}
          </CardDescription>
        </div>
        <Badge
          variant={gateBlocked ? 'destructive' : 'outline'}
          className={gateBlocked ? '' : 'border-emerald-500 text-emerald-600 font-bold uppercase'}
        >
          {gateBlocked ? 'CI Bloqueado' : 'CI Liberado'}
        </Badge>
      </CardHeader>
      <CardContent className="p-spacing-lg space-y-spacing-lg">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-spacing-md">
          {(['critical', 'high', 'warn', 'info'] as const).map((k) => {
            const v = report.summary[k];
            const tone =
              k === 'critical' || k === 'high'
                ? v > 0
                  ? 'text-destructive'
                  : 'text-emerald-600'
                : 'text-foreground';
            return (
              <div key={k} className="bg-muted/30 rounded-premium p-spacing-md text-center border border-border/20">
                <div className={`text-premium-2xl font-black ${tone}`}>{v}</div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">{k}</div>
              </div>
            );
          })}
        </div>

        <div className="space-y-spacing-xs">
          <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Achados Corrigidos</h4>
          <div className="space-y-spacing-xs">
            {report.fixed_findings.map((f) => (
              <div key={f.internal_id} className="bg-emerald-500/5 border border-emerald-500/20 rounded-premium p-spacing-md">
                <div className="flex items-center justify-between gap-spacing-xs">
                  <span className="text-premium-sm font-bold">{f.title}</span>
                  <Badge variant="outline" className="border-emerald-500 text-emerald-600 text-[10px] uppercase">
                    Fixed
                  </Badge>
                </div>
                <p className="text-premium-xs text-muted-foreground mt-spacing-2xs">{f.resolution}</p>
                <p className="text-[10px] font-mono opacity-50 mt-spacing-2xs">{f.internal_id}</p>
              </div>
            ))}
          </div>
        </div>

        {report.remaining_warnings.length > 0 && (
          <div className="space-y-spacing-xs">
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Avisos Remanescentes</h4>
            {report.remaining_warnings.map((w) => (
              <div key={w.id} className="bg-amber-500/5 border border-amber-500/20 rounded-premium p-spacing-md">
                <div className="flex items-center justify-between">
                  <span className="text-premium-xs font-mono">{w.id}</span>
                  <Badge variant="outline" className="border-amber-500 text-amber-600 text-[10px]">
                    {w.count}× {w.level}
                  </Badge>
                </div>
                <p className="text-premium-xs text-muted-foreground mt-spacing-2xs">{w.note}</p>
              </div>
            ))}
          </div>
        )}

        <div className="text-[10px] font-mono opacity-50 pt-spacing-xs border-t border-border/40">
          CI Gate: {report.ci_gate.policy} · thresholds crit≤{report.ci_gate.thresholds.critical} high≤
          {report.ci_gate.thresholds.high}
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityRescanReportCard;
