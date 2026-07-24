import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface EnrichmentRun {
  id: string;
  kind: string;
  limit_n: number | null;
  processed: number;
  updated: number;
  country_hits: number;
  vocation_hits: number;
  remaining_missing_country: number;
  remaining_missing_vocation: number;
  errors: unknown;
  status: string;
  started_at: string;
  finished_at: string | null;
}

interface Totals {
  total: number;
  withCountry: number;
  withVocation: number;
}

interface FailedSaint {
  id: string;
  name: string;
  category: string | null;
  country: string | null;
  vocation: string | null;
}

const fmt = (n: number, total: number) =>
  total > 0 ? `${n} (${Math.round((n / total) * 100)}%)` : String(n);

const SaintsEnrichmentPanel: React.FC = () => {
  const [runs, setRuns] = useState<EnrichmentRun[]>([]);
  const [totals, setTotals] = useState<Totals>({ total: 0, withCountry: 0, withVocation: 0 });
  const [failed, setFailed] = useState<FailedSaint[]>([]);
  const [limit, setLimit] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [runsRes, allRes, failedRes] = await Promise.all([
      supabase
        .from('saints_enrichment_runs' as never)
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20),
      supabase.from('saints').select('id, country, vocation', { count: 'exact', head: false }),
      supabase
        .from('saints')
        .select('id, name, category, country, vocation')
        .or('country.is.null,vocation.is.null')
        .order('name')
        .limit(50),
    ]);

    if (runsRes.error) toast.error('Falha ao ler execuções: ' + runsRes.error.message);
    else setRuns((runsRes.data ?? []) as EnrichmentRun[]);

    if (!allRes.error && allRes.data) {
      const rows = allRes.data as Array<{ country: string | null; vocation: string | null }>;
      setTotals({
        total: rows.length,
        withCountry: rows.filter((r) => r.country).length,
        withVocation: rows.filter((r) => r.vocation).length,
      });
    }

    if (!failedRes.error) setFailed((failedRes.data ?? []) as FailedSaint[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runEnrichment = useCallback(async () => {
    setRunning(true);
    try {
      const n = limit.trim() ? Number(limit.trim()) : null;
      if (n !== null && (!Number.isFinite(n) || n <= 0)) {
        toast.error('Limite inválido');
        return;
      }
      const { data, error } = await supabase.rpc(
        'run_saints_enrichment_heuristic' as never,
        { p_limit: n } as never,
      );
      if (error) throw error;
      const row = (data ?? null) as EnrichmentRun | null;
      toast.success(
        row
          ? `Rodada concluída: ${row.updated}/${row.processed} atualizados`
          : 'Rodada concluída',
      );
      await load();
    } catch (e: unknown) {
      toast.error('Falha ao executar: ' + (e as Error).message);
    } finally {
      setRunning(false);
    }
  }, [limit, load]);

  const stats = useMemo(
    () => ({
      missingCountry: totals.total - totals.withCountry,
      missingVocation: totals.total - totals.withVocation,
    }),
    [totals],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle>Enriquecimento (País &amp; Vocação)</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Preenche automaticamente os campos <code>country</code> e <code>vocation</code> via
            heurística determinística.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Limite (opcional)"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="w-40"
            min={1}
          />
          <Button onClick={runEnrichment} disabled={running}>
            {running ? 'Executando…' : 'Executar rodada'}
          </Button>
          <Button variant="ghost" onClick={load} disabled={loading}>
            Recarregar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Totais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label="Total de santos" value={String(totals.total)} />
          <StatBox
            label="Com país"
            value={fmt(totals.withCountry, totals.total)}
            tone={stats.missingCountry === 0 ? 'ok' : 'warn'}
          />
          <StatBox
            label="Com vocação"
            value={fmt(totals.withVocation, totals.total)}
            tone={stats.missingVocation === 0 ? 'ok' : 'warn'}
          />
          <StatBox
            label="Faltando"
            value={`${stats.missingCountry} país · ${stats.missingVocation} vocação`}
            tone={stats.missingCountry + stats.missingVocation === 0 ? 'ok' : 'warn'}
          />
        </div>

        {/* Runs */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Execuções recentes</h3>
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma execução ainda.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2">Início</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-right p-2">Limite</th>
                    <th className="text-right p-2">Processados</th>
                    <th className="text-right p-2">Atualizados</th>
                    <th className="text-right p-2">País</th>
                    <th className="text-right p-2">Vocação</th>
                    <th className="text-right p-2">Restantes (p/v)</th>
                    <th className="text-center p-2">Status</th>
                    <th className="text-center p-2">Erros</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => {
                    const errCount = Array.isArray(r.errors) ? r.errors.length : 0;
                    return (
                      <tr key={r.id} className="border-t">
                        <td className="p-2 whitespace-nowrap">
                          {new Date(r.started_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-2">{r.kind}</td>
                        <td className="p-2 text-right">{r.limit_n ?? '—'}</td>
                        <td className="p-2 text-right">{r.processed}</td>
                        <td className="p-2 text-right">{r.updated}</td>
                        <td className="p-2 text-right">{r.country_hits}</td>
                        <td className="p-2 text-right">{r.vocation_hits}</td>
                        <td className="p-2 text-right">
                          {r.remaining_missing_country}/{r.remaining_missing_vocation}
                        </td>
                        <td className="p-2 text-center">
                          <Badge variant={r.status === 'completed' ? 'default' : 'secondary'}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          {errCount > 0 ? (
                            <Badge variant="destructive">{errCount}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Registros pendentes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">
              Registros pendentes ({stats.missingCountry + stats.missingVocation > 0 ? 'primeiros 50' : 'nenhum'})
            </h3>
            {failed.length > 0 && (
              <Button size="sm" onClick={runEnrichment} disabled={running}>
                Retentar pendentes
              </Button>
            )}
          </div>
          {failed.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todos os santos estão enriquecidos.</p>
          ) : (
            <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
              {failed.map((s) => (
                <div key={s.id} className="p-2 flex items-center justify-between text-xs">
                  <span className="font-medium truncate">{s.name}</span>
                  <span className="text-muted-foreground flex gap-2">
                    {!s.country && <Badge variant="outline">sem país</Badge>}
                    {!s.vocation && <Badge variant="outline">sem vocação</Badge>}
                    {s.category && <span>· {s.category}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const StatBox: React.FC<{ label: string; value: string; tone?: 'ok' | 'warn' }> = ({
  label,
  value,
  tone,
}) => (
  <div
    className={`rounded-lg border p-3 ${
      tone === 'ok'
        ? 'border-emerald-500/30 bg-emerald-500/5'
        : tone === 'warn'
          ? 'border-amber-500/30 bg-amber-500/5'
          : 'bg-muted/30'
    }`}
  >
    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="text-sm font-semibold mt-1">{value}</p>
  </div>
);

export default SaintsEnrichmentPanel;
