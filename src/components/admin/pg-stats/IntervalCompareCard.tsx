import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { GitCompareArrows, Download, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { fingerprintQuery, shortFingerprint } from './queryFingerprint';
import type { SnapshotHistoryRow } from './useSnapshotHistory';
import { supabase } from '@/integrations/supabase/client';

const fmtMs = (v: number) =>
  v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${v.toFixed(2)} ms`;
const fmtInt = (v: number) => (v ?? 0).toLocaleString('pt-BR');

interface Agg {
  fingerprint: string;
  example: string;
  calls: number;
  totalMs: number;
  meanMs: number;
  p95Ms: number;
}

function aggregate(snapshots: SnapshotHistoryRow[]): Map<string, Agg> {
  const map = new Map<string, Agg>();
  for (const s of snapshots) {
    for (const r of s.rows || []) {
      const fp = fingerprintQuery(r.query);
      const cur = map.get(fp) || {
        fingerprint: fp,
        example: r.query,
        calls: 0,
        totalMs: 0,
        meanMs: 0,
        p95Ms: 0,
      };
      cur.calls += r.calls || 0;
      cur.totalMs += r.total_exec_time || 0;
      cur.p95Ms = Math.max(cur.p95Ms, r.max_exec_time || 0);
      map.set(fp, cur);
    }
  }
  for (const v of map.values()) {
    v.meanMs = v.calls > 0 ? v.totalMs / v.calls : 0;
  }
  return map;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function todayIso(): string { return toIsoDate(new Date()); }
function daysAgoIso(days: number): string {
  const d = new Date(); d.setDate(d.getDate() - days); return toIsoDate(d);
}

const DEFAULT_REG_MEAN_PCT = 20;
const DEFAULT_REG_P95_PCT = 25;

function readParam(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  return new URLSearchParams(window.location.search).get(name) ?? fallback;
}

export function IntervalCompareCard({ snapshots }: { snapshots: SnapshotHistoryRow[] }) {
  const [aFrom, setAFrom] = useState(() => readParam('aFrom', daysAgoIso(14)));
  const [aTo, setATo] = useState(() => readParam('aTo', daysAgoIso(7)));
  const [bFrom, setBFrom] = useState(() => readParam('bFrom', daysAgoIso(7)));
  const [bTo, setBTo] = useState(() => readParam('bTo', todayIso()));
  const [onlyRegressions, setOnlyRegressions] = useState(() => readParam('onlyReg', '') === '1');
  const [userId, setUserId] = useState<string | null>(null);
  const [regMean, setRegMean] = useState<number>(DEFAULT_REG_MEAN_PCT);
  const [regP95, setRegP95] = useState<number>(DEFAULT_REG_P95_PCT);

  // load user + persisted thresholds (per user, fallback session)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);
      const key = uid ? `pgstats:reg:${uid}` : 'pgstats:reg:session';
      const raw = (uid ? localStorage.getItem(key) : sessionStorage.getItem(key));
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed.mean === 'number') setRegMean(parsed.mean);
          if (typeof parsed.p95 === 'number') setRegP95(parsed.p95);
        } catch { /* ignore */ }
      }
      // URL params override persisted
      const urlMean = Number(readParam('regMean', ''));
      const urlP95 = Number(readParam('regP95', ''));
      if (Number.isFinite(urlMean) && urlMean > 0) setRegMean(urlMean);
      if (Number.isFinite(urlP95) && urlP95 > 0) setRegP95(urlP95);
    })();
    return () => { cancelled = true; };
  }, []);

  // persist thresholds
  useEffect(() => {
    const payload = JSON.stringify({ mean: regMean, p95: regP95 });
    const key = userId ? `pgstats:reg:${userId}` : 'pgstats:reg:session';
    try {
      if (userId) localStorage.setItem(key, payload);
      else sessionStorage.setItem(key, payload);
    } catch { /* ignore quota */ }
  }, [regMean, regP95, userId]);

  const filterByRange = (from: string, to: string) => {
    const fromT = new Date(from + 'T00:00:00').getTime();
    const toT = new Date(to + 'T23:59:59').getTime();
    return snapshots.filter((s) => {
      const t = new Date(s.taken_at).getTime();
      return t >= fromT && t <= toT;
    });
  };

  const rangeA = useMemo(() => filterByRange(aFrom, aTo), [snapshots, aFrom, aTo]);
  const rangeB = useMemo(() => filterByRange(bFrom, bTo), [snapshots, bFrom, bTo]);

  const rows = useMemo(() => {
    const a = aggregate(rangeA);
    const b = aggregate(rangeB);
    const keys = new Set<string>([...a.keys(), ...b.keys()]);
    const out: Array<{
      fingerprint: string;
      example: string;
      aMean: number; bMean: number; dMeanPct: number;
      aP95: number; bP95: number; dP95Pct: number;
      aCalls: number; bCalls: number; dCallsPct: number;
      aTotal: number; bTotal: number;
      regression: boolean;
    }> = [];
    for (const k of keys) {
      const ra = a.get(k);
      const rb = b.get(k);
      const aMean = ra?.meanMs ?? 0;
      const bMean = rb?.meanMs ?? 0;
      const aP95 = ra?.p95Ms ?? 0;
      const bP95 = rb?.p95Ms ?? 0;
      const aCalls = ra?.calls ?? 0;
      const bCalls = rb?.calls ?? 0;
      const dMeanPct = aMean > 0 ? ((bMean - aMean) / aMean) * 100 : (bMean > 0 ? 100 : 0);
      const dP95Pct = aP95 > 0 ? ((bP95 - aP95) / aP95) * 100 : (bP95 > 0 ? 100 : 0);
      const dCallsPct = aCalls > 0 ? ((bCalls - aCalls) / aCalls) * 100 : (bCalls > 0 ? 100 : 0);
      const regression = (dMeanPct >= regMean && bMean > 5)
                      || (dP95Pct >= regP95 && bP95 > 20);
      out.push({
        fingerprint: k,
        example: rb?.example || ra?.example || '',
        aMean, bMean, dMeanPct,
        aP95, bP95, dP95Pct,
        aCalls, bCalls, dCallsPct,
        aTotal: ra?.totalMs ?? 0, bTotal: rb?.totalMs ?? 0,
        regression,
      });
    }
    out.sort((x, y) => (y.bTotal + y.aTotal) - (x.bTotal + x.aTotal));
    return onlyRegressions ? out.filter((r) => r.regression) : out.slice(0, 50);
  }, [rangeA, rangeB, onlyRegressions, regMean, regP95]);

  const buildShareUrl = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('aFrom', aFrom); params.set('aTo', aTo);
    params.set('bFrom', bFrom); params.set('bTo', bTo);
    params.set('onlyReg', onlyRegressions ? '1' : '0');
    params.set('regMean', String(regMean));
    params.set('regP95', String(regP95));
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  const copyShareUrl = async () => {
    try {
      const url = buildShareUrl();
      await navigator.clipboard.writeText(url);
      window.history.replaceState(null, '', url);
      toast.success('Link copiado — filtros e intervalos preservados');
    } catch {
      toast.error('Falha ao copiar link');
    }
  };

  const exportCsv = () => {
    const escape = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = [
      'fingerprint','regression',
      'a_mean_ms','b_mean_ms','delta_mean_pct',
      'a_p95_ms','b_p95_ms','delta_p95_pct',
      'a_calls','b_calls','delta_calls_pct',
      'a_total_ms','b_total_ms','example',
    ];
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push([
        r.fingerprint, r.regression ? '1' : '0',
        r.aMean.toFixed(3), r.bMean.toFixed(3), r.dMeanPct.toFixed(1),
        r.aP95.toFixed(3), r.bP95.toFixed(3), r.dP95Pct.toFixed(1),
        r.aCalls, r.bCalls, r.dCallsPct.toFixed(1),
        r.aTotal.toFixed(3), r.bTotal.toFixed(3), r.example,
      ].map(escape).join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pg_stat_compare_${aFrom}_${aTo}__vs__${bFrom}_${bTo}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} linhas exportadas`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <GitCompareArrows className="h-4 w-4" />
          Comparar intervalos (A × B)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-md border p-3 space-y-2">
            <p className="text-xs font-medium">Intervalo A ({rangeA.length} snapshots)</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">De</Label>
                <Input type="date" value={aFrom} onChange={(e) => setAFrom(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Até</Label>
                <Input type="date" value={aTo} onChange={(e) => setATo(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="rounded-md border p-3 space-y-2">
            <p className="text-xs font-medium">Intervalo B ({rangeB.length} snapshots)</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">De</Label>
                <Input type="date" value={bFrom} onChange={(e) => setBFrom(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Até</Label>
                <Input type="date" value={bTo} onChange={(e) => setBTo(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm" variant={onlyRegressions ? 'default' : 'outline'}
            onClick={() => setOnlyRegressions((v) => !v)}
          >
            {onlyRegressions ? 'Mostrando só regressões' : 'Só regressões'}
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
          <p className="text-xs text-muted-foreground ml-auto">
            Regressão: média ≥ +{REGRESSION_MEAN_PCT}% ou p95 ≥ +{REGRESSION_P95_PCT}%
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fingerprint</TableHead>
                <TableHead className="text-right">Média A</TableHead>
                <TableHead className="text-right">Média B</TableHead>
                <TableHead className="text-right">Δ média</TableHead>
                <TableHead className="text-right">p95 A</TableHead>
                <TableHead className="text-right">p95 B</TableHead>
                <TableHead className="text-right">Δ p95</TableHead>
                <TableHead className="text-right">Δ calls</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-6 text-sm">
                    Nenhum dado nos intervalos selecionados.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r, i) => (
                <TableRow key={i} className={r.regression ? 'bg-destructive/5' : ''}>
                  <TableCell className="font-mono text-xs max-w-md truncate">
                    {r.regression && (
                      <Badge variant="destructive" className="mr-2 text-[10px]">REG</Badge>
                    )}
                    {shortFingerprint(r.fingerprint, 90)}
                  </TableCell>
                  <TableCell className="text-right text-xs">{fmtMs(r.aMean)}</TableCell>
                  <TableCell className="text-right text-xs">{fmtMs(r.bMean)}</TableCell>
                  <TableCell className={`text-right text-xs font-medium ${
                    r.dMeanPct > 0 ? 'text-destructive' : r.dMeanPct < 0 ? 'text-primary' : ''
                  }`}>
                    {r.dMeanPct > 0 ? '+' : ''}{r.dMeanPct.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right text-xs">{fmtMs(r.aP95)}</TableCell>
                  <TableCell className="text-right text-xs">{fmtMs(r.bP95)}</TableCell>
                  <TableCell className={`text-right text-xs font-medium ${
                    r.dP95Pct > 0 ? 'text-destructive' : r.dP95Pct < 0 ? 'text-primary' : ''
                  }`}>
                    {r.dP95Pct > 0 ? '+' : ''}{r.dP95Pct.toFixed(1)}%
                  </TableCell>
                  <TableCell className={`text-right text-xs ${
                    r.dCallsPct > 0 ? 'text-muted-foreground' : ''
                  }`}>
                    {fmtInt(r.aCalls)} → {fmtInt(r.bCalls)}
                    {' '}
                    <span className="opacity-60">
                      ({r.dCallsPct > 0 ? '+' : ''}{r.dCallsPct.toFixed(0)}%)
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
