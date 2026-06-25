import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BIBLE_MISSING_CHAPTERS, MISSING_CHAPTER_REASON } from '@/lib/bibleMissingChapters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, AlertTriangle, CheckCircle2, Database, Globe2 } from 'lucide-react';
import { toast } from 'sonner';

type SourceTag = 'Cathedra (Local)' | 'BollsLife (Fallback)' | 'BibliaCatolica (Ave-Maria)' | 'unavailable' | string | null;

interface SourceEntry {
  abbrev: string;
  chapter: number;
  source: SourceTag;
  cache: string;
  status_code: number;
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

export default function BibleSourcesAudit() {
  const [entries, setEntries] = useState<SourceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bible_cache_metric_events')
      .select('abbrev, chapter, source, cache, status_code, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);
    setEntries((data ?? []) as SourceEntry[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Última fonte usada por (abbrev, chapter)
  const latestBySource = useMemo(() => {
    const map = new Map<string, SourceEntry>();
    for (const e of entries) {
      const key = `${e.abbrev}:${e.chapter}`;
      if (!map.has(key)) map.set(key, e);
    }
    return map;
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

  const runImport = async () => {
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('bible-import-deutero', {
        body: { dryRun: false },
      });
      if (error) throw error;
      toast.success(`Importação concluída: ${data?.imported ?? 0}/${data?.total ?? 0} capítulos.`);
      console.log('[bible-import-deutero]', data);
      await load();
    } catch (e: any) {
      toast.error(`Falha no import: ${e?.message ?? e}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">Auditoria de Fontes da Bíblia</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Capítulos marcados como indisponíveis e origem usada na última requisição.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runImport} disabled={importing} size="sm">
            {importing ? 'Importando…' : 'Importar capítulos faltantes'}
          </Button>
          <Button onClick={load} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </div>

      {/* Sumário de fontes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(sourceCounts).map(([src, count]) => (
          <Card key={src}>
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider">{src}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{count}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Capítulos marcados indisponíveis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Capítulos indisponíveis (lista hardcoded)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">{MISSING_CHAPTER_REASON}</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capítulo</TableHead>
                <TableHead>Última fonte registrada</TableHead>
                <TableHead>Último cache</TableHead>
                <TableHead className="text-right">Última atualização</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missingList.map(({ abbrev, chapter }) => {
                const entry = latestBySource.get(`${abbrev}:${chapter}`);
                const resolved = entry && entry.source && entry.source !== 'unavailable';
                return (
                  <TableRow key={`${abbrev}:${chapter}`}>
                    <TableCell className="font-mono text-xs">{abbrev} {chapter}</TableCell>
                    <TableCell>{sourceBadge(entry?.source ?? null)}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{entry?.cache ?? '—'}</Badge></TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {entry ? new Date(entry.created_at).toLocaleString() : '—'}
                    </TableCell>
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

      {/* Últimos 50 capítulos servidos */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Origem nas últimas 50 requisições</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Capítulo</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Cache</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.slice(0, 50).map((e, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-mono">{new Date(e.created_at).toLocaleTimeString()}</TableCell>
                  <TableCell className="font-mono text-xs">{e.abbrev} {e.chapter}</TableCell>
                  <TableCell>{sourceBadge(e.source)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{e.cache}</Badge></TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{e.status_code}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
