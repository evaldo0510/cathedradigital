import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface BreakdownEntry { label: string; ms: number }

interface EventRow {
  correlation_id: string | null;
  abbrev: string;
  chapter: number;
  cache: string | null;
  total_ms: number | null;
  sql_ms: number | null;
  edge_ms: number | null;
  bolls_ms: number | null;
  sql_breakdown: BreakdownEntry[] | null;
  created_at: string;
}

function cacheBadgeVariant(cache: string | null): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (cache === 'HIT') return 'default';
  if (cache === 'MISS') return 'destructive';
  if (cache?.startsWith('STALE')) return 'secondary';
  return 'outline';
}

export default function SqlBreakdownSection() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [abbrevFilter, setAbbrevFilter] = useState('');
  const [correlationFilter, setCorrelationFilter] = useState('');
  const [limit, setLimit] = useState(50);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('bible_cache_metric_events')
      .select('correlation_id, abbrev, chapter, cache, total_ms, sql_ms, edge_ms, bolls_ms, sql_breakdown, created_at')
      .not('sql_breakdown', 'is', null)
      .order('created_at', { ascending: false })
      .limit(Math.max(1, Math.min(500, limit)));
    if (abbrevFilter.trim()) q = q.eq('abbrev', abbrevFilter.trim());
    if (correlationFilter.trim()) q = q.eq('correlation_id', correlationFilter.trim());
    const { data, error } = await q;
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setRows((data ?? []) as unknown as EventRow[]);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const stats = useMemo(() => {
    if (!rows.length) return null;
    const total = rows.length;
    const hits = rows.filter(r => r.cache === 'HIT').length;
    const avgSql = Math.round(rows.reduce((s, r) => s + (r.sql_ms ?? 0), 0) / total);
    const avgTotal = Math.round(rows.reduce((s, r) => s + (r.total_ms ?? 0), 0) / total);
    return {
      total,
      hitRate: Math.round((hits / total) * 100),
      avgSql,
      avgTotal,
    };
  }, [rows]);

  const toggle = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4" /> Breakdown por <code>correlation_id</code>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Livro (abbrev)</Label>
            <Input value={abbrevFilter} onChange={(e) => setAbbrevFilter(e.target.value)} placeholder="ex: Lv" className="w-28" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">correlation_id</Label>
            <Input value={correlationFilter} onChange={(e) => setCorrelationFilter(e.target.value)} placeholder="opcional" className="w-72" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Limite</Label>
            <Input type="number" min={1} max={500} value={limit} onChange={(e) => setLimit(Number(e.target.value) || 50)} className="w-24" />
          </div>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Buscar
          </Button>
          {stats && (
            <div className="ml-auto text-xs text-muted-foreground flex gap-3">
              <span>{stats.total} eventos</span>
              <span>cache hit {stats.hitRate}%</span>
              <span>avg sql {stats.avgSql}ms</span>
              <span>avg total {stats.avgTotal}ms</span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Mostra apenas eventos com <code>sql_breakdown</code> persistido. Clique numa linha para expandir as etapas SQL com tempo (wall-clock) por <em>label</em>.
        </p>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Quando</TableHead>
                <TableHead>Livro</TableHead>
                <TableHead>Cap</TableHead>
                <TableHead>Cache</TableHead>
                <TableHead className="text-right">total ms</TableHead>
                <TableHead className="text-right">sql ms</TableHead>
                <TableHead className="text-right">edge ms</TableHead>
                <TableHead className="text-right">upstream ms</TableHead>
                <TableHead>correlation_id</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-6">Sem eventos.</TableCell></TableRow>
              )}
              {rows.map((r, i) => {
                const id = `${r.correlation_id ?? 'nil'}-${i}`;
                const open = expanded.has(id);
                const entries = Array.isArray(r.sql_breakdown) ? r.sql_breakdown : [];
                const sumEntries = entries.reduce((s, e) => s + (Number(e.ms) || 0), 0);
                return (
                  <React.Fragment key={id}>
                    <TableRow className="cursor-pointer hover:bg-muted/40" onClick={() => toggle(id)}>
                      <TableCell>{open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</TableCell>
                      <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                      <TableCell className="font-mono">{r.abbrev}</TableCell>
                      <TableCell>{r.chapter}</TableCell>
                      <TableCell><Badge variant={cacheBadgeVariant(r.cache)}>{r.cache ?? '—'}</Badge></TableCell>
                      <TableCell className="text-right">{r.total_ms ?? '—'}</TableCell>
                      <TableCell className="text-right">{r.sql_ms ?? '—'}</TableCell>
                      <TableCell className="text-right">{r.edge_ms ?? '—'}</TableCell>
                      <TableCell className="text-right">{r.bolls_ms ?? '—'}</TableCell>
                      <TableCell className="font-mono text-[11px] truncate max-w-[200px]" title={r.correlation_id ?? ''}>
                        {r.correlation_id ?? '—'}
                      </TableCell>
                    </TableRow>
                    {open && (
                      <TableRow>
                        <TableCell colSpan={10} className="bg-muted/30">
                          {entries.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Sem etapas registradas.</p>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-xs text-muted-foreground">
                                Soma das etapas: <strong>{sumEntries}ms</strong> · sql_ms (wall-clock fundido): <strong>{r.sql_ms ?? 0}ms</strong>
                                {sumEntries > (r.sql_ms ?? 0) && (
                                  <span className="ml-2 text-amber-600">(diferença = paralelismo)</span>
                                )}
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Etapa</TableHead>
                                    <TableHead className="text-right">ms</TableHead>
                                    <TableHead className="text-right">% do sql_ms</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {[...entries].sort((a, b) => b.ms - a.ms).map((e, j) => {
                                    const pct = r.sql_ms ? Math.round((e.ms / r.sql_ms) * 100) : 0;
                                    return (
                                      <TableRow key={j}>
                                        <TableCell className="font-mono text-xs">{e.label}</TableCell>
                                        <TableCell className="text-right">{e.ms}</TableCell>
                                        <TableCell className="text-right">{pct}%</TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
