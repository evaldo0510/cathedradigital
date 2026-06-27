import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import {
  RescanReportSchema,
  RescanHistorySchema,
  type RescanReport,
  type RescanHistory,
  type RescanHistoryEntry,
} from '@/lib/securityRescanSchema';

const REPORT_URL = '/security-rescan-report.json';
const HISTORY_URL = '/security-rescan-history.json';

const downloadJson = (data: unknown, name: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

const SecurityRescanReportCard: React.FC = () => {
  const [report, setReport] = useState<RescanReport | null>(null);
  const [history, setHistory] = useState<RescanHistory | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    fetch(REPORT_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((raw) => {
        const parsed = RescanReportSchema.safeParse(raw);
        if (!parsed.success) throw new Error('Schema inválido: ' + parsed.error.issues[0]?.message);
        setReport(parsed.data);
      })
      .catch((e) => setReportError(e.message));

    fetch(HISTORY_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((raw) => {
        const parsed = RescanHistorySchema.safeParse(raw);
        if (!parsed.success) throw new Error('Schema inválido: ' + parsed.error.issues[0]?.message);
        setHistory(parsed.data);
      })
      .catch((e) => setHistoryError(e.message));
  }, []);

  const gateBlocked = useMemo(
    () => !!report && (report.summary.critical > 0 || report.summary.high > 0),
    [report],
  );

  const blockingIds = useMemo(() => {
    if (!report) return [];
    return report.fixed_findings
      .filter((f) =>
        ['critical', 'high'].some((sev) => f.resolution.toLowerCase().includes(sev)),
      )
      .map((f) => f.internal_id);
  }, [report]);

  return (
    <div className="space-y-spacing-lg">
      {/* Relatório atual + Gate */}
      <Card className="rounded-[2rem] border-primary/10 shadow-premium overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40 flex flex-row items-start justify-between gap-spacing-md">
          <div>
            <CardTitle className="text-premium-lg font-black uppercase tracking-widest flex items-center gap-spacing-xs">
              <Icons.ShieldCheck className="text-primary w-spacing-md h-spacing-md" />
              Relatório de Re-scan
            </CardTitle>
            <CardDescription className="font-serif italic">
              {report
                ? `${new Date(report.scanned_at).toLocaleString('pt-BR')} · ${report.trigger}`
                : reportError ?? 'Carregando…'}
            </CardDescription>
          </div>
          {report && (
            <div className="flex items-center gap-spacing-xs">
              <Badge
                variant={gateBlocked ? 'destructive' : 'outline'}
                className={gateBlocked ? '' : 'border-emerald-500 text-emerald-600 font-bold uppercase'}
              >
                {gateBlocked ? 'CI Bloqueado' : 'CI Liberado'}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="rounded-premium-full gap-spacing-xs"
                onClick={() => downloadJson(report, `${report.scan_id}.json`)}
              >
                <Icons.Download className="w-spacing-sm h-spacing-sm" /> JSON
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-spacing-lg space-y-spacing-lg">
          {reportError && (
            <div className="text-premium-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-premium p-spacing-md">
              Falha ao validar relatório: {reportError}
            </div>
          )}
          {report && (
            <>
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
                    <div
                      key={k}
                      className="bg-muted/30 rounded-premium p-spacing-md text-center border border-border/20"
                    >
                      <div className={`text-premium-2xl font-black ${tone}`}>{v}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-60">
                        {k}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status detalhado do gate */}
              <div
                className={`rounded-premium border p-spacing-md ${
                  gateBlocked
                    ? 'bg-destructive/5 border-destructive/30'
                    : 'bg-emerald-500/5 border-emerald-500/30'
                }`}
              >
                <div className="flex items-center gap-spacing-xs">
                  {gateBlocked ? (
                    <Icons.AlertTriangle className="text-destructive w-spacing-md h-spacing-md" />
                  ) : (
                    <Icons.CheckCircle className="text-emerald-600 w-spacing-md h-spacing-md" />
                  )}
                  <span className="text-premium-sm font-bold uppercase tracking-widest">
                    {gateBlocked ? 'Build falhou' : 'Build OK'}
                  </span>
                </div>
                <p className="text-premium-xs text-muted-foreground mt-spacing-2xs">
                  Política: <code className="font-mono">{report.ci_gate.policy}</code> · thresholds
                  crit≤{report.ci_gate.thresholds.critical} high≤{report.ci_gate.thresholds.high}
                </p>
                {gateBlocked && blockingIds.length > 0 && (
                  <ul className="mt-spacing-xs space-y-spacing-2xs text-premium-xs">
                    {blockingIds.map((id) => (
                      <li key={id} className="font-mono opacity-80">
                        ⚠ {id}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-spacing-xs">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  Achados Corrigidos
                </h4>
                {report.fixed_findings.map((f) => (
                  <div
                    key={f.internal_id}
                    className="bg-emerald-500/5 border border-emerald-500/20 rounded-premium p-spacing-md"
                  >
                    <div className="flex items-center justify-between gap-spacing-xs">
                      <span className="text-premium-sm font-bold">{f.title}</span>
                      <Badge
                        variant="outline"
                        className="border-emerald-500 text-emerald-600 text-[10px] uppercase"
                      >
                        Fixed
                      </Badge>
                    </div>
                    <p className="text-premium-xs text-muted-foreground mt-spacing-2xs">
                      {f.resolution}
                    </p>
                    <p className="text-[10px] font-mono opacity-50 mt-spacing-2xs">{f.internal_id}</p>
                  </div>
                ))}
              </div>

              {report.remaining_warnings.length > 0 && (
                <div className="space-y-spacing-xs">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">
                    Avisos Remanescentes
                  </h4>
                  {report.remaining_warnings.map((w) => (
                    <div
                      key={w.id}
                      className="bg-amber-500/5 border border-amber-500/20 rounded-premium p-spacing-md"
                    >
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card className="rounded-[2rem] border-primary/10 shadow-premium overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40">
          <CardTitle className="text-premium-lg font-black uppercase tracking-widest flex items-center gap-spacing-xs">
            <Icons.History className="text-primary w-spacing-md h-spacing-md" />
            Histórico de Varreduras
          </CardTitle>
          <CardDescription className="font-serif italic">
            Últimas execuções do gate de segurança
          </CardDescription>
        </CardHeader>
        <CardContent className="p-spacing-lg">
          {historyError && (
            <div className="text-premium-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-premium p-spacing-md">
              Falha ao carregar histórico: {historyError}
            </div>
          )}
          {history && history.runs.length === 0 && (
            <p className="text-premium-sm text-muted-foreground italic">Sem execuções registradas.</p>
          )}
          {history && history.runs.length > 0 && (
            <div className="divide-y divide-border/40">
              {history.runs.map((run: RescanHistoryEntry) => (
                <div
                  key={run.scan_id}
                  className="py-spacing-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-xs"
                >
                  <div className="space-y-spacing-2xs">
                    <div className="flex items-center gap-spacing-xs">
                      <Badge
                        variant={run.gate.blocked ? 'destructive' : 'outline'}
                        className={
                          run.gate.blocked
                            ? ''
                            : 'border-emerald-500 text-emerald-600 text-[10px] uppercase'
                        }
                      >
                        {run.gate.blocked ? 'Falhou' : 'OK'}
                      </Badge>
                      <span className="text-premium-sm font-bold">{run.scan_id}</span>
                    </div>
                    <p className="text-premium-xs text-muted-foreground">
                      {new Date(run.scanned_at).toLocaleString('pt-BR')} · {run.trigger}
                      {run.commit ? ` · ${run.commit.substring(0, 7)}` : ''}
                      {run.pr ? ` · PR #${run.pr}` : ''}
                    </p>
                    <p className="text-[10px] font-mono opacity-60">
                      crit:{run.summary.critical} · high:{run.summary.high} · warn:{run.summary.warn}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-premium-full gap-spacing-xs"
                    onClick={() => window.open(run.report_url, '_blank')}
                  >
                    <Icons.Download className="w-spacing-sm h-spacing-sm" /> Baixar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityRescanReportCard;
