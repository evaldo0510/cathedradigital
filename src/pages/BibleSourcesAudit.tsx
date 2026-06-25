import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BIBLE_MISSING_CHAPTERS, MISSING_CHAPTER_REASON } from '@/lib/bibleMissingChapters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, AlertTriangle, CheckCircle2, Database, Globe2, Repeat, FileText, Download, Wand2, Layers } from 'lucide-react';
import { toast } from 'sonner';

const BATCH_CONCURRENCY = 2;
const BATCH_MAX_PER_RUN = 25;

type SourceTag = 'Cathedra (Local)' | 'BollsLife (Fallback)' | 'BibliaCatolica (Ave-Maria)' | 'unavailable' | string | null;

interface SourceEntry {
  abbrev: string;
  chapter: number;
  source: SourceTag;
  cache: string;
  status_code: number;
  created_at: string;
}

interface AlertRow {
  id: string;
  severity: string;
  message: string;
  details: any;
  is_resolved: boolean | null;
  created_at: string;
}

function sourceBadge(s: SourceTag) {
  if (!s) return <Badge variant="outline">—</Badge>;
  if (s.startsWith('Cathedra')) return <Badge className="bg-emerald-100 text-emerald-800"><Database className="w-3 h-3 mr-1" />Banco (dump)</Badge>;
  if (s.startsWith('BollsLife')) return <Badge className="bg-blue-100 text-blue-800"><Globe2 className="w-3 h-3 mr-1" />bolls.life</Badge>;
  if (s.startsWith('BibliaCatolica')) return <Badge className="bg-amber-100 text-amber-800"><Globe2 className="w-3 h-3 mr-1" />BibliaCatolica</Badge>;
  if (s === 'unavailable') return <Badge variant="destructive">Indisponível</Badge>;
  return <Badge variant="outline">{s}</Badge>;
}

const RETRY_INTERVAL_MS = 5 * 60 * 1000; // 5 min
const RETRY_COOLDOWN_MS = 2 * 60 * 1000;  // 2 min entre retries do mesmo capítulo

export default function BibleSourcesAudit() {
  const [entries, setEntries] = useState<SourceEntry[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [autoRetry, setAutoRetry] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [retryLog, setRetryLog] = useState<{ ts: string; target: string; outcome: string }[]>([]);
  const lastRetryAt = useRef<Map<string, number>>(new Map());

  const load = async () => {
    setLoading(true);
    const [m, a] = await Promise.all([
      supabase.from('bible_cache_metric_events')
        .select('abbrev, chapter, source, cache, status_code, created_at')
        .order('created_at', { ascending: false }).limit(1000),
      supabase.from('bible_audit_alerts')
        .select('id, severity, message, details, is_resolved, created_at')
        .order('created_at', { ascending: false }).limit(20),
    ]);
    setEntries((m.data ?? []) as SourceEntry[]);
    setAlerts((a.data ?? []) as AlertRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const latestBySource = useMemo(() => {
    const map = new Map<string, SourceEntry>();
    for (const e of entries) {
      const key = `${e.abbrev}:${e.chapter}`;
      if (!map.has(key)) map.set(key, e);
    }
    return map;
  }, [entries]);

  const unavailableChapters = useMemo(() => {
    const seen = new Set<string>();
    const out: SourceEntry[] = [];
    for (const e of entries) {
      const key = `${e.abbrev}:${e.chapter}`;
      if (seen.has(key)) continue;
      if (e.source === 'unavailable' || e.status_code >= 400) {
        seen.add(key);
        out.push(e);
      } else {
        seen.add(key); // primeira ocorrência foi sucesso, ignora
      }
    }
    return out;
  }, [entries]);

  const missingList = useMemo(() => {
    const rows: { abbrev: string; chapter: number }[] = [];
    for (const [abbr, chapters] of Object.entries(BIBLE_MISSING_CHAPTERS)) {
      for (const ch of chapters) rows.push({ abbrev: abbr, chapter: ch });
    }
    return rows;
  }, []);

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of latestBySource.values()) {
      const k = (e.source ?? 'unknown') as string;
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return counts;
  }, [latestBySource]);

  // SLA por fonte: agrupa eventos por source com total, unavailable, avg latency.
  const sourceSla = useMemo(() => {
    const buckets = new Map<string, { total: number; unavailable: number; sumMs: number; samples: number; errors: number }>();
    for (const e of entries) {
      const src = (e.source ?? 'unknown') as string;
      const b = buckets.get(src) ?? { total: 0, unavailable: 0, sumMs: 0, samples: 0, errors: 0 };
      b.total++;
      if (src === 'unavailable' || e.status_code >= 400) b.unavailable++;
      if (e.status_code >= 500) b.errors++;
      const ms = (e as any).total_ms;
      if (typeof ms === 'number' && ms > 0) { b.sumMs += ms; b.samples++; }
      buckets.set(src, b);
    }
    return [...buckets.entries()].map(([source, b]) => ({
      source,
      total: b.total,
      unavailable: b.unavailable,
      errors: b.errors,
      unavailableRate: b.total > 0 ? b.unavailable / b.total : 0,
      avgMs: b.samples > 0 ? Math.round(b.sumMs / b.samples) : null,
    })).sort((a, b) => b.total - a.total);
  }, [entries]);

  const exportCsv = () => {
    const rows: string[][] = [[
      'alert_id', 'created_at', 'severity', 'book', 'chapter', 'source', 'root_cause', 'attempts', 'last_seen', 'message',
    ]];
    for (const a of alerts) {
      const d: any = a.details ?? {};
      const newP = Array.isArray(d.new_problems) ? d.new_problems : [];
      const recP = Array.isArray(d.recurrent_problems) ? d.recurrent_problems : [];
      const items = [...newP, ...recP];
      if (items.length === 0) {
        rows.push([a.id, a.created_at, a.severity, '', '', '', '', '', '', a.message ?? '']);
        continue;
      }
      for (const p of items) {
        const cause = Array.isArray(p.failed_sources) && p.failed_sources.length > 0
          ? `failed:${p.failed_sources.join('|')}`
          : 'unknown';
        rows.push([
          a.id,
          a.created_at,
          a.severity,
          String(p.abbrev ?? ''),
          String(p.chapter ?? ''),
          Array.isArray(p.failed_sources) ? p.failed_sources.join('|') : '',
          cause,
          String(p.occurrences ?? ''),
          String(p.last_seen ?? ''),
          (a.message ?? '').replace(/[\r\n]+/g, ' '),
        ]);
      }
    }
    const csv = rows.map(r => r.map(c => {
      const s = String(c ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bible-availability-alerts-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success(`CSV exportado (${rows.length - 1} linhas)`);
  };


  const runImport = async (targets?: { abbrev: string; chapter: number }[]) => {
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('bible-import-deutero', {
        body: { dryRun: false, ...(targets ? { targets } : {}) },
      });
      if (error) throw error;
      toast.success(`Importação: ${data?.imported ?? 0}/${data?.total ?? 0}.`);
      await load();
      return data;
    } catch (e: any) {
      toast.error(`Falha no import: ${e?.message ?? e}`);
    } finally {
      setImporting(false);
    }
  };

  const runReport = async () => {
    setReporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('bible-availability-report', {
        body: { hours: 24 },
      });
      if (error) throw error;
      toast.success(`Relatório: ${data?.report?.problem_chapters ?? 0} problemas, ${data?.report?.new_problem_chapters ?? 0} novos.`);
      await load();
    } catch (e: any) {
      toast.error(`Falha no relatório: ${e?.message ?? e}`);
    } finally {
      setReporting(false);
    }
  };

  // Re-tenta um capítulo: primeiro re-chama bible-text (que tenta bolls→bibliacatolica),
  // se ainda vier unavailable, escala para bible-import-deutero com target específico.
  const retryChapter = async (abbrev: string, chapter: number) => {
    const key = `${abbrev}:${chapter}`;
    const now = Date.now();
    const last = lastRetryAt.current.get(key) ?? 0;
    if (now - last < RETRY_COOLDOWN_MS) return { outcome: 'cooldown' };
    lastRetryAt.current.set(key, now);

    try {
      const { data } = await supabase.functions.invoke('bible-text', {
        body: { abbrev, chapter, force_revalidate: true },
      });
      if (data?.unavailable) {
        const imp = await supabase.functions.invoke('bible-import-deutero', {
          body: { dryRun: false, targets: [{ abbrev, chapter }] },
        });
        const result = imp.data?.results?.[0];
        return { outcome: result?.status === 'imported' ? `imported (${result.verses}v)` : `failed: ${result?.error ?? result?.status ?? 'unknown'}` };
      }
      return { outcome: `resolved via ${data?.metadata?.source ?? 'unknown'}` };
    } catch (e: any) {
      return { outcome: `error: ${e?.message ?? e}` };
    }
  };

  // Auto-retry loop
  useEffect(() => {
    if (!autoRetry) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      if (unavailableChapters.length === 0) return;
      const log: typeof retryLog = [];
      for (const c of unavailableChapters.slice(0, 5)) {
        const r = await retryChapter(c.abbrev, c.chapter);
        log.push({ ts: new Date().toISOString(), target: `${c.abbrev} ${c.chapter}`, outcome: r.outcome });
      }
      if (!cancelled) {
        setRetryLog(prev => [...log, ...prev].slice(0, 30));
        await load();
      }
    };
    tick();
    const id = setInterval(tick, RETRY_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRetry, unavailableChapters.length]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Auditoria de Fontes da Bíblia</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Origem usada por capítulo, alertas de indisponibilidade e auto-retry.
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
            <Repeat className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="auto-retry" className="text-xs">Auto-retry (5min)</Label>
            <Switch id="auto-retry" checked={autoRetry} onCheckedChange={setAutoRetry} />
          </div>
          <Button onClick={runReport} disabled={reporting} size="sm" variant="secondary">
            <FileText className="w-4 h-4 mr-2" />{reporting ? 'Gerando…' : 'Gerar relatório'}
          </Button>
          <Button onClick={() => runImport()} disabled={importing} size="sm">
            {importing ? 'Importando…' : 'Importar faltantes'}
          </Button>
          <Button onClick={load} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </div>

      {/* Alertas recentes */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Alertas recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead className="text-right">Novos / Recorrentes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs font-mono">{new Date(a.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={a.severity === 'critical' ? 'destructive' : 'secondary'}>{a.severity}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{a.message}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {a.details?.new_problem_chapters ?? 0} / {a.details?.recurrent_problem_chapters ?? 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Sumário de fontes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(sourceCounts).map(([src, count]) => (
          <Card key={src}>
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider">{src}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{count}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Indisponíveis ao vivo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Capítulos servidos como unavailable ({unavailableChapters.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unavailableChapters.length === 0 ? (
            <p className="text-sm text-emerald-700 py-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Nenhum capítulo indisponível nas últimas requisições registradas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Capítulo</TableHead>
                  <TableHead>Última fonte</TableHead>
                  <TableHead>Quando</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unavailableChapters.map((e) => (
                  <TableRow key={`${e.abbrev}:${e.chapter}`}>
                    <TableCell className="font-mono text-xs">{e.abbrev} {e.chapter}</TableCell>
                    <TableCell>{sourceBadge(e.source)}</TableCell>
                    <TableCell className="text-xs font-mono">{new Date(e.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={async () => {
                        const r = await retryChapter(e.abbrev, e.chapter);
                        toast.message(`${e.abbrev} ${e.chapter}: ${r.outcome}`);
                        setRetryLog(prev => [{ ts: new Date().toISOString(), target: `${e.abbrev} ${e.chapter}`, outcome: r.outcome }, ...prev].slice(0, 30));
                        await load();
                      }}>
                        <Repeat className="w-3 h-3 mr-1" /> Re-tentar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Log de auto-retry */}
      {retryLog.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Log de tentativas ({retryLog.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
              {retryLog.map((r, i) => (
                <div key={i}><span className="text-muted-foreground">{new Date(r.ts).toLocaleTimeString()}</span> · <span className="font-semibold">{r.target}</span> → {r.outcome}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista hardcoded de gaps conhecidos */}
      {missingList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Gaps conhecidos (hardcoded)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">{MISSING_CHAPTER_REASON}</p>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Capítulo</TableHead><TableHead>Última fonte</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {missingList.map(({ abbrev, chapter }) => {
                  const entry = latestBySource.get(`${abbrev}:${chapter}`);
                  const resolved = entry && entry.source && entry.source !== 'unavailable';
                  return (
                    <TableRow key={`${abbrev}:${chapter}`}>
                      <TableCell className="font-mono text-xs">{abbrev} {chapter}</TableCell>
                      <TableCell>{sourceBadge(entry?.source ?? null)}</TableCell>
                      <TableCell>
                        {resolved
                          ? <span className="text-emerald-600 flex items-center gap-1 text-xs"><CheckCircle2 className="w-3 h-3" />resolvido</span>
                          : <span className="text-amber-600 text-xs">pendente</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
