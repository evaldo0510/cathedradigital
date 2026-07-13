// Sprint A / CAT-001 — Dashboard admin: saúde da rastreabilidade CID
// Consome a Edge Function `cid-compliance-stats` (admin-only via RLS na
// tabela cid_compliance_snapshots) e mostra:
//   - snapshot atual (contagem por dimensão e por categoria)
//   - lista de funções com etapas em falha
//   - tendência ao longo do tempo (cobertura, ausente, falhas)

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend,
} from 'recharts';

type Counts = { conforme: number; herdado: number; na: number; ausente: number; desconhecido?: number };
type Category = { total: number; cidOk: number; failed: number };
type Snapshot = {
  captured_at: string;
  commit_sha: string | null;
  branch: string | null;
  coverage_ratio: number;
  coverage_pct: string;
  total_functions: number;
  cid_counts: Counts;
  validation_counts: Counts;
  http_counts: Counts;
  test_counts: Counts;
  by_category: Record<string, Category>;
  failing_functions: { name: string; category: string; failed_steps: string[] }[];
};
type TrendPoint = { t: string; coverage_ratio: number; total: number; ausente: number; failing: number; sha: string | null };
type StatsResponse = { data: { latest: Snapshot | null; trend: TrendPoint[]; count: number; window_days: number }; correlation_id: string };

export default function CidComplianceDashboardPage() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [days, setDays] = useState<'7' | '30' | '90'>('30');

  const { data, isLoading, error } = useQuery({
    queryKey: ['cid-compliance-stats', days],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<StatsResponse>('cid-compliance-stats', {
        method: 'GET',
        // supabase-js typa GET com query via body sério; usamos fetch direto:
      } as any);
      if (error) throw error;
      return data as StatsResponse;
    },
  });

  const latest = data?.data?.latest ?? null;
  const trend = data?.data?.trend ?? [];

  const failingByCategory = useMemo(() => {
    if (!latest) return [];
    return Object.entries(latest.by_category)
      .map(([cat, c]) => ({ cat, ...c }))
      .sort((a, b) => b.failed - a.failed);
  }, [latest]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Saúde da rastreabilidade CID</h1>
          <p className="text-sm text-muted-foreground">
            Snapshots do cid-compliance-report (matriz de 47 Edge Functions).
          </p>
        </div>
        <Select value={days} onValueChange={(v) => setDays(v as '7' | '30' | '90')}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
          </SelectContent>
        </Select>
      </header>

      {isLoading && <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>}
      {error && (
        <Card className="p-6 border-destructive">
          <p className="text-destructive">Erro ao carregar estatísticas: {(error as Error).message}</p>
        </Card>
      )}

      {!isLoading && !latest && (
        <Card className="p-6">
          <p className="text-muted-foreground">
            Nenhum snapshot persistido ainda. Rode o workflow <code>edge-cid-smoke</code>
            {' '}com <code>SUPABASE_SERVICE_ROLE_KEY</code> configurada para popular a tabela.
          </p>
        </Card>
      )}

      {latest && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Cobertura CID" value={latest.coverage_pct}
              tone={latest.cid_counts.ausente === 0 ? 'ok' : 'warn'} />
            <StatCard label="Funções" value={String(latest.total_functions)} />
            <StatCard label="CID ausente" value={String(latest.cid_counts.ausente)}
              tone={latest.cid_counts.ausente === 0 ? 'ok' : 'bad'} />
            <StatCard label="Com etapas em falha" value={String(latest.failing_functions.length)}
              tone={latest.failing_functions.length === 0 ? 'ok' : 'bad'} />
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Tendência ({data!.data.window_days} dias · {trend.length} snapshots)</h2>
            {trend.length < 2 ? (
              <p className="text-sm text-muted-foreground">Precisa de ao menos 2 snapshots para desenhar a tendência.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="t" tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                  <YAxis yAxisId="l" domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <YAxis yAxisId="r" orientation="right" />
                  <Tooltip labelFormatter={(v) => new Date(v as string).toLocaleString()} />
                  <Legend />
                  <Line yAxisId="l" type="monotone" dataKey="coverage_ratio" name="Cobertura" stroke="#22c55e" dot={false} />
                  <Line yAxisId="r" type="monotone" dataKey="ausente" name="CID ausente" stroke="#ef4444" dot={false} />
                  <Line yAxisId="r" type="monotone" dataKey="failing" name="Etapas em falha" stroke="#f59e0b" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Por categoria</h2>
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr><th>Categoria</th><th className="text-right">Total</th><th className="text-right">CID OK</th><th className="text-right">Em falha</th></tr>
                </thead>
                <tbody>
                  {failingByCategory.map((r) => (
                    <tr key={r.cat} className="border-t">
                      <td className="py-2">{r.cat}</td>
                      <td className="text-right">{r.total}</td>
                      <td className="text-right">{r.cidOk}</td>
                      <td className="text-right">
                        {r.failed > 0
                          ? <Badge variant="destructive">{r.failed}</Badge>
                          : <span className="text-muted-foreground">0</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Funções em falha ({latest.failing_functions.length})
              </h2>
              {latest.failing_functions.length === 0 ? (
                <p className="text-sm flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" /> Nenhuma função em falha.
                </p>
              ) : (
                <ul className="space-y-2 text-sm max-h-72 overflow-auto">
                  {latest.failing_functions.map((f) => (
                    <li key={f.name} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <code className="font-mono">{f.name}</code>
                        <span className="text-muted-foreground"> · {f.category}</span>
                        <div className="text-xs text-muted-foreground">
                          {f.failed_steps.join(' · ')}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <p className="text-xs text-muted-foreground">
            Último snapshot: {new Date(latest.captured_at).toLocaleString()}
            {latest.commit_sha ? ` · sha ${latest.commit_sha.slice(0, 7)}` : ''}
            {latest.branch ? ` · ${latest.branch}` : ''}
          </p>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' | 'bad' }) {
  const cls =
    tone === 'ok' ? 'text-green-600' :
    tone === 'warn' ? 'text-amber-600' :
    tone === 'bad' ? 'text-destructive' :
    'text-foreground';
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${cls}`}>{value}</div>
    </Card>
  );
}
