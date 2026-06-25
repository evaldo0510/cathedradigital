import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  RefreshCw, Activity, FlaskConical, Flame, AlertTriangle, Download, Check, Settings as SettingsIcon, LineChart as LineChartIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceDot,
} from 'recharts';

interface MetricRow {
  abbrev: string;
  chapter: number;
  cache: string | null;
  total_ms: number | null;
  bolls_ms: number | null;
  source: string | null;
  created_at: string;
}

interface BookBreakdown {
  abbrev: string;
  cache: string;
  samples: number;
  avgTotal: number;
  avgUpstream: number;
  avgInternal: number;
  p95Total: number;
}

const CHAPTERS: Record<string, number> = {
  Gn: 50, Ex: 40, Lv: 27, Nm: 36, Dt: 34, Js: 24, Jz: 21, Rt: 4,
  '1Sm': 31, '2Sm': 24, '1Rs': 22, '2Rs': 25, '1Cr': 29, '2Cr': 36,
  Ed: 10, Ne: 13, Et: 10, 'Jó': 42, Sl: 150, Pv: 31, Ec: 12, Ct: 8,
  Is: 66, Jr: 52, Lm: 5, Ez: 48, Dn: 14, Os: 14, Jl: 3, Am: 9, Ab: 1,
  Jn: 4, Mq: 7, Na: 3, Hc: 3, Sf: 3, Ag: 2, Zc: 14, Ml: 4,
  Mt: 28, Mc: 16, Lc: 24, Jo: 21, At: 28, Rm: 16, '1Co': 16, '2Co': 13,
  Gl: 6, Ef: 6, Fp: 4, Cl: 4, '1Ts': 5, '2Ts': 3, '1Tm': 6, '2Tm': 4,
  Tt: 3, Fm: 1, Hb: 13, Tg: 5, '1Pe': 5, '2Pe': 3, '1Jo': 5, '2Jo': 1, '3Jo': 1, Jd: 1, Ap: 22,
  Tb: 14, Jdt: 16, Sb: 19, Eclo: 51, Br: 6, '1Mc': 16, '2Mc': 15,
};

const TIERS = {
  hot: ['Sl', 'Pv', 'Mt', 'Mc', 'Lc', 'Jo'],
  pentateuch: ['Gn', 'Ex', 'Lv', 'Nm', 'Dt', 'Js'],
  deutero: ['Tb', 'Jdt', 'Sb', 'Eclo', 'Br', '1Mc', '2Mc'],
};

const SETTINGS_KEY = 'bible.perfSettings.v1';

interface PerfSettings {
  regressionDays: number;
  regressionThresholdMs: number;
  regressionMinSamples: number;
  warmThresholdMs: number;
  warmConcurrency: number;
  warmMaxPerBook: number;
  warmAvgMsEstimate: number;
}

const DEFAULT_SETTINGS: PerfSettings = {
  regressionDays: 3,
  regressionThresholdMs: 800,
  regressionMinSamples: 20,
  warmThresholdMs: 800,
  warmConcurrency: 4,
  warmMaxPerBook: 10,
  warmAvgMsEstimate: 450,
};

function loadSettings(): PerfSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { return DEFAULT_SETTINGS; }
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return Math.round(s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]);
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => {
      const s = String(c ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

interface AlertRow {
  id: string;
  severity: string;
  message: string;
  details: any;
  is_resolved: boolean;
  created_at: string;
}

interface HistoryPoint {
  day: string;
  avg: number;
  p95: number;
  total: number;
  hits: number;
  misses: number;
  hadAlert?: boolean;
}

export default function BiblePerfBreakdown() {
  const [rows, setRows] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(24);
  const [settings, setSettings] = useState<PerfSettings>(loadSettings);
  const [simTier, setSimTier] = useState<'hot' | 'pentateuch' | 'deutero' | 'all' | 'custom'>('pentateuch');
  const [customBooks, setCustomBooks] = useState<string>('Lv,Nm');

  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [warmLogs, setWarmLogs] = useState<any[]>([]);
  const [warmSummary, setWarmSummary] = useState<any | null>(null);
  const [warmRunning, setWarmRunning] = useState(false);

  const [historyBook, setHistoryBook] = useState<string>('Lv');
  const [historyDays, setHistoryDays] = useState<number>(14);
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  const [warmHistory, setWarmHistory] = useState<any[]>([]);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const [retentionCfg, setRetentionCfg] = useState<{ retention_days: number; auto_cleanup_enabled: boolean; updated_at?: string } | null>(null);
  const [retentionEditDays, setRetentionEditDays] = useState<number>(90);
  const [retentionEditAuto, setRetentionEditAuto] = useState<boolean>(true);
  const [retentionStats, setRetentionStats] = useState<{ total: number; oldest?: string; eligible: number } | null>(null);
  const [cleanupRuns, setCleanupRuns] = useState<any[]>([]);
  const [cleanupBusy, setCleanupBusy] = useState(false);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const load = async () => {
    setLoading(true);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('bible_cache_metric_events')
      .select('abbrev, chapter, cache, total_ms, bolls_ms, source, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5000);
    if (error) toast.error(error.message);
    setRows((data ?? []) as MetricRow[]);
    setLoading(false);
  };

  const loadAlerts = async () => {
    const { data, error } = await supabase
      .from('bible_audit_alerts')
      .select('id, severity, message, details, is_resolved, created_at')
      .ilike('message', 'Regressão de latência%')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) { toast.error(error.message); return; }
    setAlerts((data ?? []) as AlertRow[]);
  };

  const loadHistory = async () => {
    const sinceDate = new Date(Date.now() - historyDays * 24 * 60 * 60 * 1000);
    const since = sinceDate.toISOString();
    const { data: metrics, error } = await supabase
      .from('bible_cache_metrics')
      .select('bucket_start, abbrev, hits, misses, total, sum_ms, p95_ms')
      .eq('abbrev', historyBook)
      .gte('bucket_start', since)
      .order('bucket_start', { ascending: true });
    if (error) { toast.error(error.message); return; }

    const perDay = new Map<string, { sum: number; total: number; p95: number; hits: number; misses: number }>();
    for (const m of metrics ?? []) {
      const day = (m.bucket_start as string).slice(0, 10);
      const agg = perDay.get(day) ?? { sum: 0, total: 0, p95: 0, hits: 0, misses: 0 };
      agg.sum += Number(m.sum_ms ?? 0);
      agg.total += Number(m.total ?? 0);
      agg.p95 = Math.max(agg.p95, Number(m.p95_ms ?? 0));
      agg.hits += Number(m.hits ?? 0);
      agg.misses += Number(m.misses ?? 0);
      perDay.set(day, agg);
    }

    const { data: alertRows } = await supabase
      .from('bible_audit_alerts')
      .select('created_at, details')
      .ilike('message', 'Regressão de latência%')
      .gte('created_at', since);
    const alertDays = new Set<string>();
    for (const a of alertRows ?? []) {
      const regressed = (a.details as any)?.regressed as any[] | undefined;
      if (regressed?.some((r) => r.abbrev === historyBook)) {
        alertDays.add((a.created_at as string).slice(0, 10));
      }
    }

    const points: HistoryPoint[] = [...perDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({
        day,
        avg: v.total ? Math.round(v.sum / v.total) : 0,
        p95: v.p95,
        total: v.total,
        hits: v.hits,
        misses: v.misses,
        hadAlert: alertDays.has(day),
      }));

    // moving average (3-day)
    const withMA = points.map((p, i) => {
      const slice = points.slice(Math.max(0, i - 2), i + 1);
      const ma = Math.round(slice.reduce((s, x) => s + x.avg, 0) / slice.length);
      return { ...p, ma } as HistoryPoint & { ma: number };
    });
    setHistory(withMA);
  };

  useEffect(() => { load(); loadAlerts(); /* eslint-disable-next-line */ }, [hours]);
  useEffect(() => { loadHistory(); /* eslint-disable-next-line */ }, [historyBook, historyDays]);

  const breakdown = useMemo<BookBreakdown[]>(() => {
    const map = new Map<string, { total: number[]; upstream: number[] }>();
    for (const r of rows) {
      const total = r.total_ms;
      if (typeof total !== 'number') continue;
      const cache = r.cache ?? 'UNKNOWN';
      const key = `${r.abbrev}|${cache}`;
      const b = map.get(key) ?? { total: [], upstream: [] };
      b.total.push(total);
      b.upstream.push(typeof r.bolls_ms === 'number' && r.bolls_ms > 0 ? r.bolls_ms : 0);
      map.set(key, b);
    }
    return [...map.entries()].map(([key, b]) => {
      const [abbrev, cache] = key.split('|');
      const avgTotal = Math.round(b.total.reduce((s, v) => s + v, 0) / b.total.length);
      const avgUpstream = Math.round(b.upstream.reduce((s, v) => s + v, 0) / b.upstream.length);
      return {
        abbrev, cache,
        samples: b.total.length,
        avgTotal,
        avgUpstream,
        avgInternal: Math.max(0, avgTotal - avgUpstream),
        p95Total: percentile(b.total, 95),
      };
    }).sort((a, b) => b.avgTotal - a.avgTotal);
  }, [rows]);

  const slowBooks = useMemo(() =>
    breakdown
      .filter((b) => b.avgTotal > settings.warmThresholdMs)
      .map((b) => b.abbrev)
      .filter((v, i, a) => a.indexOf(v) === i),
    [breakdown, settings.warmThresholdMs]);

  const targetBooks = useMemo<string[]>(() => {
    if (simTier === 'all') return Object.keys(CHAPTERS);
    if (simTier === 'custom') {
      return customBooks.split(',').map((s) => s.trim()).filter((s) => CHAPTERS[s]);
    }
    return (TIERS as any)[simTier] as string[];
  }, [simTier, customBooks]);

  const simulation = useMemo(() => {
    const totalChapters = targetBooks.reduce((s, b) => s + Math.min(settings.warmMaxPerBook, CHAPTERS[b] ?? 0), 0);
    const wallMs = Math.ceil(totalChapters / Math.max(1, settings.warmConcurrency)) * settings.warmAvgMsEstimate;
    const secs = Math.round(wallMs / 1000);
    return {
      totalChapters,
      durationLabel: `${Math.floor(secs / 60)}m${secs % 60}s`,
      impactedSlowBooks: targetBooks.filter((b) => slowBooks.includes(b)),
    };
  }, [targetBooks, settings, slowBooks]);

  const loadWarmHistory = async () => {
    const { data, error } = await supabase
      .from('bible_audit_action_logs')
      .select('id, user_id, action, metadata, created_at')
      .in('action', ['warmup.dry_run', 'warmup.execute'])
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) { /* silent: pode não ser admin */ return; }
    setWarmHistory(data ?? []);
  };

  const loadRetention = async () => {
    const [{ data: cfg }, { data: runs }] = await Promise.all([
      supabase.from('bible_audit_log_retention_config').select('retention_days, auto_cleanup_enabled, updated_at').eq('id', true).maybeSingle(),
      supabase.from('bible_audit_log_cleanup_runs').select('id, triggered_by, retention_days, rows_deleted, duration_ms, status, error, created_at').order('created_at', { ascending: false }).limit(20),
    ]);
    if (cfg) {
      setRetentionCfg(cfg as any);
      setRetentionEditDays(cfg.retention_days as number);
      setRetentionEditAuto(cfg.auto_cleanup_enabled as boolean);
    }
    setCleanupRuns(runs ?? []);

    const days = (cfg?.retention_days as number) ?? 90;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const [{ count: total }, { count: eligible }, { data: oldest }] = await Promise.all([
      supabase.from('bible_audit_action_logs').select('*', { count: 'exact', head: true }),
      supabase.from('bible_audit_action_logs').select('*', { count: 'exact', head: true }).lt('created_at', cutoff),
      supabase.from('bible_audit_action_logs').select('created_at').order('created_at', { ascending: true }).limit(1),
    ]);
    setRetentionStats({
      total: total ?? 0,
      eligible: eligible ?? 0,
      oldest: oldest?.[0]?.created_at as string | undefined,
    });
  };

  const saveRetention = async () => {
    const { error } = await supabase
      .from('bible_audit_log_retention_config')
      .update({ retention_days: retentionEditDays, auto_cleanup_enabled: retentionEditAuto, updated_at: new Date().toISOString() })
      .eq('id', true);
    if (error) { toast.error(error.message); return; }
    toast.success('Configuração de retenção atualizada');
    loadRetention();
  };

  const runCleanupNow = async () => {
    setCleanupBusy(true);
    const { data, error } = await supabase.rpc('cleanup_bible_audit_action_logs', {
      p_triggered_by: 'manual',
      p_override_days: null,
    });
    setCleanupBusy(false);
    if (error) { toast.error(error.message); return; }
    const r = Array.isArray(data) ? data[0] : data;
    toast.success(`Limpeza executada: ${r?.rows_deleted ?? 0} linha(s) removida(s) (retenção ${r?.retention_days}d)`);
    loadRetention();
    loadWarmHistory();
  };

  useEffect(() => { loadWarmHistory(); loadRetention(); }, []);

  const runOnDemandWarm = async (dry: boolean) => {
    setWarmRunning(true);
    setWarmLogs([]); setWarmSummary(null);
    const isCustomList = simTier !== 'all';
    const params = {
      threshold_ms: settings.warmThresholdMs,
      concurrency: settings.warmConcurrency,
      max_chapters_per_book: settings.warmMaxPerBook,
      dry_run: dry,
      verbose: true,
      books: isCustomList ? targetBooks : undefined,
    };
    const startedAt = Date.now();
    const { data, error } = await supabase.functions.invoke('bible-auto-warm-slow', { body: params });
    setWarmRunning(false);
    if (error) { toast.error(error.message); return; }
    setWarmSummary(data);
    setWarmLogs((data?.logs ?? data?.sample ?? []) as any[]);

    // Aggregate per-book results from verbose logs
    const perBook: Record<string, { ok: number; fail: number; total_ms: number; count: number }> = {};
    for (const l of (data?.logs ?? []) as any[]) {
      const b = perBook[l.abbrev] ?? { ok: 0, fail: 0, total_ms: 0, count: 0 };
      if (l.ok) b.ok++; else b.fail++;
      b.total_ms += Number(l.ms) || 0;
      b.count++;
      perBook[l.abbrev] = b;
    }

    // Log to audit trail
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('bible_audit_action_logs').insert({
      user_id: user?.id,
      action: dry ? 'warmup.dry_run' : 'warmup.execute',
      entity_type: 'bible-auto-warm-slow',
      entity_id: simTier === 'custom' ? customBooks : simTier,
      metadata: {
        tier: simTier,
        params: { ...params, books: params.books ?? null },
        target_books: targetBooks,
        queued: data?.queued ?? 0,
        estimated_duration_ms: data?.estimated_duration_ms ?? null,
        executed: data?.executed ?? null,
        elapsed_client_ms: Date.now() - startedAt,
        per_book: perBook,
      },
    });
    loadWarmHistory();

    toast.success(dry
      ? `Dry-run: ${data?.queued ?? 0} capítulos · ~${Math.round((data?.estimated_duration_ms ?? 0) / 1000)}s`
      : `Executado: ${data?.executed?.ok ?? 0} ok / ${data?.executed?.fail ?? 0} fail em ${data?.executed?.ms ?? 0}ms`);
  };

  const runRegressionCheck = async (dry: boolean) => {
    const { data, error } = await supabase.functions.invoke('bible-latency-regression-alert', {
      body: {
        days: settings.regressionDays,
        threshold_ms: settings.regressionThresholdMs,
        min_samples: settings.regressionMinSamples,
        dry_run: dry,
      },
    });
    if (error) { toast.error(error.message); return; }
    toast.message(`Regressão (${dry ? 'dry-run' : 'gravado'}): ${data?.regressed_count ?? 0} livro(s)`, {
      description: (data?.regressed ?? []).slice(0, 5).map((r: any) => `${r.abbrev} ${r.window_avg}ms`).join(' · ') || 'nenhum acima do limiar',
    });
    if (!dry) loadAlerts();
  };

  const resolveAlert = async (id: string) => {
    const { error } = await supabase
      .from('bible_audit_alerts')
      .update({ is_resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Alerta resolvido');
    loadAlerts();
  };

  const exportBreakdownCsv = () => {
    const header = ['abbrev', 'cache', 'samples', 'avg_internal_sql_edge_ms', 'avg_upstream_network_ms', 'render_ms', 'avg_total_ms', 'p95_total_ms'];
    const data = breakdown.map((b) => [b.abbrev, b.cache, b.samples, b.avgInternal, b.avgUpstream || 0, 'client-only', b.avgTotal, b.p95Total]);
    downloadCsv(`bible-perf-breakdown-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...data]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Breakdown de Performance da Bíblia</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Por livro × versão de cache (HIT/MISS/STALE). SQL+Edge = <code>total_ms − bolls_ms</code>.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="hours" className="text-xs">Janela (horas)</Label>
            <Input id="hours" type="number" min={1} max={168} value={hours}
                   onChange={(e) => setHours(Math.max(1, Math.min(168, Number(e.target.value) || 24)))}
                   className="w-24" />
          </div>
          <Button onClick={load} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
          <Button onClick={exportBreakdownCsv} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* Configurações persistentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" /> Configurações (persistidas localmente)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Regressão: janela (dias)</Label>
              <Input type="number" min={1} max={30} value={settings.regressionDays}
                     onChange={(e) => setSettings({ ...settings, regressionDays: Math.max(1, Math.min(30, Number(e.target.value) || 3)) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Regressão: limiar (ms)</Label>
              <Input type="number" min={100} max={5000} step={50} value={settings.regressionThresholdMs}
                     onChange={(e) => setSettings({ ...settings, regressionThresholdMs: Math.max(100, Math.min(5000, Number(e.target.value) || 800)) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Regressão: amostras mín.</Label>
              <Input type="number" min={1} max={1000} value={settings.regressionMinSamples}
                     onChange={(e) => setSettings({ ...settings, regressionMinSamples: Math.max(1, Math.min(1000, Number(e.target.value) || 20)) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Warm: limiar (ms)</Label>
              <Input type="number" min={100} max={5000} step={50} value={settings.warmThresholdMs}
                     onChange={(e) => setSettings({ ...settings, warmThresholdMs: Math.max(100, Math.min(5000, Number(e.target.value) || 800)) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Warm: concorrência</Label>
              <Input type="number" min={1} max={16} value={settings.warmConcurrency}
                     onChange={(e) => setSettings({ ...settings, warmConcurrency: Math.max(1, Math.min(16, Number(e.target.value) || 4)) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Warm: máx. capítulos/livro</Label>
              <Input type="number" min={1} max={150} value={settings.warmMaxPerBook}
                     onChange={(e) => setSettings({ ...settings, warmMaxPerBook: Math.max(1, Math.min(150, Number(e.target.value) || 10)) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Warm: ms/capítulo (estim.)</Label>
              <Input type="number" min={100} max={10000} step={50} value={settings.warmAvgMsEstimate}
                     onChange={(e) => setSettings({ ...settings, warmAvgMsEstimate: Math.max(100, Math.min(10000, Number(e.target.value) || 450)) })} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="sm" onClick={() => setSettings(DEFAULT_SETTINGS)}>
                Resetar padrão
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Aplicado nas chamadas a <code>bible-auto-warm-slow</code> e <code>bible-latency-regression-alert</code>. Salvo em <code>localStorage</code>.
          </p>
        </CardContent>
      </Card>

      {/* Warmup on-demand */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FlaskConical className="w-4 h-4" /> Warmup sob demanda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Alvo</Label>
              <select value={simTier} onChange={(e) => setSimTier(e.target.value as any)}
                      className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                <option value="pentateuch">Pentateuco + Js</option>
                <option value="hot">Hot (Sl, Pv, evangelhos)</option>
                <option value="deutero">Deuterocanônicos</option>
                <option value="all">Todos os 73 livros</option>
                <option value="custom">Lista customizada</option>
              </select>
            </div>
            {simTier === 'custom' && (
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">Livros (separados por vírgula)</Label>
                <Input value={customBooks} onChange={(e) => setCustomBooks(e.target.value)} placeholder="Lv,Nm,Dt" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="p-3 rounded border bg-card">
              <div className="text-xs text-muted-foreground">Livros</div>
              <div className="text-lg font-semibold">{targetBooks.length}</div>
            </div>
            <div className="p-3 rounded border bg-card">
              <div className="text-xs text-muted-foreground">Capítulos (cap)</div>
              <div className="text-lg font-semibold">{simulation.totalChapters}</div>
            </div>
            <div className="p-3 rounded border bg-card">
              <div className="text-xs text-muted-foreground">Duração estimada</div>
              <div className="text-lg font-semibold">{simulation.durationLabel}</div>
            </div>
            <div className="p-3 rounded border bg-card">
              <div className="text-xs text-muted-foreground">Livros lentos no alvo</div>
              <div className="text-lg font-semibold">{simulation.impactedSlowBooks.length}</div>
              <div className="text-[10px] text-muted-foreground truncate">{simulation.impactedSlowBooks.join(', ') || '—'}</div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => runOnDemandWarm(true)} disabled={warmRunning}>
              <FlaskConical className="w-4 h-4 mr-2" /> Dry-run
            </Button>
            <Button size="sm" onClick={() => runOnDemandWarm(false)} disabled={warmRunning}>
              <Flame className="w-4 h-4 mr-2" /> Executar
            </Button>
            <Button size="sm" variant="outline" onClick={() => runRegressionCheck(true)}>
              <AlertTriangle className="w-4 h-4 mr-2" /> Checar regressão (dry)
            </Button>
            <Button size="sm" variant="outline" onClick={() => runRegressionCheck(false)}>
              <AlertTriangle className="w-4 h-4 mr-2" /> Checar e gravar alerta
            </Button>
          </div>

          {warmSummary && (
            <div className="text-xs text-muted-foreground border rounded p-2 bg-muted/30">
              <span className="font-mono">queued={warmSummary.queued}</span>{' · '}
              <span>concorrência={warmSummary.concurrency}</span>{' · '}
              {warmSummary.executed
                ? <>executado: <span className="text-emerald-700 font-semibold">{warmSummary.executed.ok}</span> ok / <span className="text-red-600 font-semibold">{warmSummary.executed.fail}</span> fail em {warmSummary.executed.ms}ms</>
                : <>estimativa: ~{Math.round((warmSummary.estimated_duration_ms ?? 0) / 1000)}s</>}
            </div>
          )}

          {warmLogs.length > 0 && (
            <div className="max-h-64 overflow-auto border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Livro</TableHead>
                    <TableHead className="text-xs">Cap</TableHead>
                    <TableHead className="text-xs">Motivo</TableHead>
                    <TableHead className="text-xs text-right">Status</TableHead>
                    <TableHead className="text-xs text-right">ms</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warmLogs.slice(0, 200).map((l, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{l.abbrev}</TableCell>
                      <TableCell className="text-xs">{l.chapter}</TableCell>
                      <TableCell className="text-xs">{l.reason}</TableCell>
                      <TableCell className={`text-right text-xs font-semibold ${l.ok === false ? 'text-red-600' : 'text-emerald-700'}`}>{l.status ?? '—'}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{l.ms ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Retenção & limpeza dos logs de auditoria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2"><SettingsIcon className="w-4 h-4" /> Retenção & limpeza de bible_audit_action_logs</span>
            <Button size="sm" variant="ghost" onClick={loadRetention}>
              <RefreshCw className="w-3 h-3 mr-1" /> Recarregar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="p-3 rounded border bg-card">
              <div className="text-xs text-muted-foreground">Volume total</div>
              <div className="text-lg font-semibold tabular-nums">{retentionStats?.total ?? '—'}</div>
            </div>
            <div className="p-3 rounded border bg-card">
              <div className="text-xs text-muted-foreground">Elegíveis p/ remoção</div>
              <div className="text-lg font-semibold tabular-nums text-red-600">{retentionStats?.eligible ?? '—'}</div>
            </div>
            <div className="p-3 rounded border bg-card">
              <div className="text-xs text-muted-foreground">Registro mais antigo</div>
              <div className="text-sm font-semibold">{retentionStats?.oldest ? new Date(retentionStats.oldest).toLocaleDateString() : '—'}</div>
            </div>
            <div className="p-3 rounded border bg-card">
              <div className="text-xs text-muted-foreground">Auto-limpeza</div>
              <div className="text-sm font-semibold">
                {retentionCfg?.auto_cleanup_enabled
                  ? <Badge variant="secondary">ativa (03:15 UTC)</Badge>
                  : <Badge variant="outline">desativada</Badge>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Retenção (dias)</Label>
              <Input type="number" min={1} max={3650} value={retentionEditDays}
                     onChange={(e) => setRetentionEditDays(Math.max(1, Math.min(3650, Number(e.target.value) || 90)))} />
            </div>
            <div className="space-y-1 flex flex-col">
              <Label className="text-xs">Auto-limpeza diária</Label>
              <label className="inline-flex items-center gap-2 h-9 text-sm">
                <input type="checkbox" checked={retentionEditAuto}
                       onChange={(e) => setRetentionEditAuto(e.target.checked)} />
                Executar via cron às 03:15 UTC
              </label>
            </div>
            <div className="flex items-end gap-2">
              <Button size="sm" onClick={saveRetention}>Salvar configuração</Button>
              <Button size="sm" variant="outline" onClick={runCleanupNow} disabled={cleanupBusy}>
                {cleanupBusy ? 'Executando…' : 'Executar limpeza agora'}
              </Button>
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-2">Últimas execuções do job</div>
            {cleanupRuns.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma execução registrada ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Quando</TableHead>
                    <TableHead className="text-xs">Gatilho</TableHead>
                    <TableHead className="text-xs text-right">Retenção</TableHead>
                    <TableHead className="text-xs text-right">Removidas</TableHead>
                    <TableHead className="text-xs text-right">Duração</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cleanupRuns.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={r.triggered_by === 'manual' ? 'default' : 'secondary'}>{r.triggered_by}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{r.retention_days}d</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{r.rows_deleted}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{r.duration_ms}ms</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={r.status === 'ok' ? 'secondary' : r.status === 'error' ? 'destructive' : 'outline'}>
                          {r.status}
                        </Badge>
                        {r.error && <div className="text-[10px] text-red-600 max-w-xs truncate">{r.error}</div>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit log de warmup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2"><Activity className="w-4 h-4" /> Histórico de execuções de warmup</span>
            <Button size="sm" variant="ghost" onClick={loadWarmHistory}>
              <RefreshCw className="w-3 h-3 mr-1" /> Recarregar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {warmHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Nenhuma execução registrada (apenas admins visualizam).</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Quando</TableHead>
                  <TableHead className="text-xs">Tipo</TableHead>
                  <TableHead className="text-xs">Usuário</TableHead>
                  <TableHead className="text-xs">Alvo</TableHead>
                  <TableHead className="text-xs text-right">Capítulos</TableHead>
                  <TableHead className="text-xs text-right">Estim.</TableHead>
                  <TableHead className="text-xs text-right">Real</TableHead>
                  <TableHead className="text-xs text-right">ok/fail</TableHead>
                  <TableHead className="text-xs text-right">Por livro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warmHistory.map((r) => {
                  const m = r.metadata ?? {};
                  const p = m.params ?? {};
                  const exec = m.executed;
                  const perBook = (m.per_book ?? {}) as Record<string, { ok: number; fail: number; total_ms: number; count: number }>;
                  const expanded = expandedRun === r.id;
                  return (
                    <React.Fragment key={r.id}>
                      <TableRow>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={r.action === 'warmup.execute' ? 'default' : 'secondary'}>
                            {r.action === 'warmup.execute' ? 'real' : 'dry-run'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{r.user_id ? String(r.user_id).slice(0, 8) : '—'}</TableCell>
                        <TableCell className="text-xs">
                          <div className="font-medium">{m.tier ?? '—'}</div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                            c={p.concurrency} · max/livro={p.max_chapters_per_book} · thr={p.threshold_ms}ms
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">{m.queued ?? '—'}</TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {m.estimated_duration_ms != null ? `${Math.round(m.estimated_duration_ms / 1000)}s` : '—'}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {exec?.ms != null ? `${Math.round(exec.ms / 1000)}s` : '—'}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {exec
                            ? <><span className="text-emerald-700">{exec.ok}</span>/<span className="text-red-600">{exec.fail}</span></>
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {Object.keys(perBook).length > 0 && (
                            <Button size="sm" variant="ghost" onClick={() => setExpandedRun(expanded ? null : r.id)}>
                              {expanded ? 'Ocultar' : `Ver (${Object.keys(perBook).length})`}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {expanded && (
                        <TableRow>
                          <TableCell colSpan={9} className="bg-muted/30">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 p-2">
                              {Object.entries(perBook).map(([abbr, s]) => (
                                <div key={abbr} className="text-xs border rounded p-2 bg-card">
                                  <div className="font-mono font-semibold">{abbr}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    <span className="text-emerald-700">{s.ok}</span> ok ·{' '}
                                    <span className="text-red-600">{s.fail}</span> fail
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    média {s.count ? Math.round(s.total_ms / s.count) : 0}ms
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Alertas de regressão */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Alertas de regressão de latência</span>
            <Button size="sm" variant="ghost" onClick={loadAlerts}>
              <RefreshCw className="w-3 h-3 mr-1" /> Recarregar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Nenhum alerta encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Severidade</TableHead>
                  <TableHead className="text-xs">Quando</TableHead>
                  <TableHead className="text-xs">Razão</TableHead>
                  <TableHead className="text-xs">Livros</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((a) => {
                  const regressed = (a.details?.regressed ?? []) as any[];
                  const top = regressed.slice(0, 4).map((r) => `${r.abbrev} ${r.window_avg}ms`).join(' · ');
                  return (
                    <TableRow key={a.id} className={a.is_resolved ? 'opacity-60' : ''}>
                      <TableCell>
                        <Badge variant={a.severity === 'critical' ? 'destructive' : 'secondary'}>{a.severity}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{new Date(a.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-xs max-w-md">{a.message}</TableCell>
                      <TableCell className="text-xs">
                        <span className="font-mono">{top}</span>
                        {regressed.length > 4 && <span className="text-muted-foreground"> +{regressed.length - 4}</span>}
                      </TableCell>
                      <TableCell>
                        {a.is_resolved
                          ? <Badge variant="outline" className="text-emerald-700 border-emerald-300">resolvido</Badge>
                          : <Badge variant="outline">aberto</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        {regressed[0]?.abbrev && (
                          <Button size="sm" variant="ghost" onClick={() => { setHistoryBook(regressed[0].abbrev); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }}>
                            Detalhar
                          </Button>
                        )}
                        {!a.is_resolved && (
                          <Button size="sm" variant="outline" onClick={() => resolveAlert(a.id)}>
                            <Check className="w-3 h-3 mr-1" /> Resolver
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" /> Breakdown por livro × versão de cache
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {breakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Sem eventos na janela selecionada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Livro</TableHead>
                  <TableHead>Cache</TableHead>
                  <TableHead className="text-right">Amostras</TableHead>
                  <TableHead className="text-right">SQL+Edge</TableHead>
                  <TableHead className="text-right">Upstream</TableHead>
                  <TableHead className="text-right">Render</TableHead>
                  <TableHead className="text-right">Total médio</TableHead>
                  <TableHead className="text-right">p95</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdown.map((b, i) => {
                  const slow = b.avgTotal > settings.warmThresholdMs;
                  return (
                    <TableRow key={i} className={slow ? 'bg-red-50/40' : ''}>
                      <TableCell className="font-mono text-xs">{b.abbrev}</TableCell>
                      <TableCell><Badge variant={b.cache === 'HIT' ? 'secondary' : 'outline'}>{b.cache}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{b.samples}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{b.avgInternal}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{b.avgUpstream || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-muted-foreground">client-only</TableCell>
                      <TableCell className={`text-right tabular-nums text-xs font-semibold ${slow ? 'text-red-600' : 'text-emerald-700'}`}>{b.avgTotal}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{b.p95Total}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2"><LineChartIcon className="w-4 h-4" /> Histórico por livro (média móvel 3d + p95)</span>
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Livro</Label>
                <select value={historyBook} onChange={(e) => setHistoryBook(e.target.value)}
                        className="h-8 rounded-md border bg-background px-2 text-xs">
                  {Object.keys(CHAPTERS).map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Dias</Label>
                <Input type="number" min={3} max={60} value={historyDays} className="w-20 h-8"
                       onChange={(e) => setHistoryDays(Math.max(3, Math.min(60, Number(e.target.value) || 14)))} />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Sem dados agregados para este livro/janela.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avg" name="Média (ms)" stroke="hsl(var(--primary))" dot={false} />
                <Line type="monotone" dataKey="p95" name="p95 (ms)" stroke="hsl(var(--destructive))" strokeDasharray="4 2" dot={false} />
                <Line type="monotone" dataKey="ma" name="MM 3d (ms)" stroke="#8b5cf6" dot={false} />
                {history.filter((h) => h.hadAlert).map((h, i) => (
                  <ReferenceDot key={i} x={h.day} y={h.p95} r={6} fill="hsl(var(--destructive))" stroke="white" />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
          <p className="text-[11px] text-muted-foreground mt-2">
            Pontos vermelhos marcam dias em que <code>bible-latency-regression-alert</code> abriu alerta para o livro.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
