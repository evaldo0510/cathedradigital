/**
 * Site Health — painel administrativo consolidado.
 *
 * Usa apenas tabelas já existentes: `profiles`, `analytics_events`,
 * `app_metrics`, `governance_audit_log`, `security_audit_logs` e
 * `rls_denial_events`. Somente leitura; a RLS admin-only já protege as fontes.
 */
import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Activity, Users, ShieldAlert, ScrollText, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const RANGES = [
  { days: 1, label: '24h' },
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
] as const;

function sinceIso(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

interface HealthPayload {
  totalUsers: number;
  newUsers: number;
  premiumUsers: number;
  events: number;
  activeSessions: number;
  topEvents: Array<{ name: string; count: number }>;
  metrics: Array<{ type: string; count: number }>;
  denials: number;
  securityEvents: number;
}

function useSiteHealth(days: number) {
  return useQuery<HealthPayload>({
    queryKey: ['admin-site-health', days],
    staleTime: 60_000,
    queryFn: async () => {
      const since = sinceIso(days);

      const [total, novos, premium, eventos, negacoes, seguranca, metricas] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_premium', true),
        supabase.from('analytics_events').select('event_name, session_id').gte('created_at', since).limit(5000),
        supabase.from('rls_denial_events').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('security_audit_logs').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('app_metrics').select('metric_type').gte('created_at', since).limit(5000),
      ]);

      const rows = eventos.data ?? [];
      const byName = new Map<string, number>();
      const sessions = new Set<string>();
      for (const row of rows) {
        byName.set(row.event_name, (byName.get(row.event_name) ?? 0) + 1);
        if (row.session_id) sessions.add(row.session_id);
      }

      const byMetric = new Map<string, number>();
      for (const row of metricas.data ?? []) {
        byMetric.set(row.metric_type, (byMetric.get(row.metric_type) ?? 0) + 1);
      }

      return {
        totalUsers: total.count ?? 0,
        newUsers: novos.count ?? 0,
        premiumUsers: premium.count ?? 0,
        events: rows.length,
        activeSessions: sessions.size,
        topEvents: [...byName.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8),
        metrics: [...byMetric.entries()]
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8),
        denials: negacoes.count ?? 0,
        securityEvents: seguranca.count ?? 0,
      };
    },
  });
}

function useAuditLogs(days: number) {
  return useQuery({
    queryKey: ['admin-site-health-logs', days],
    staleTime: 60_000,
    queryFn: async () => {
      const since = sinceIso(days);
      const [governance, security, denials] = await Promise.all([
        supabase
          .from('governance_audit_log')
          .select('id, occurred_at, actor_role, entity_type, operation, correlation_id')
          .gte('occurred_at', since)
          .order('occurred_at', { ascending: false })
          .limit(25),
        supabase
          .from('security_audit_logs')
          .select('id, created_at, event_type, severity, description')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(25),
        supabase
          .from('rls_denial_events')
          .select('id, created_at, table_name, action, reason')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(25),
      ]);
      return {
        governance: governance.data ?? [],
        security: security.data ?? [],
        denials: denials.data ?? [],
      };
    },
  });
}

const StatCard: React.FC<{ title: string; value: string | number; hint?: string; icon: React.ElementType }> = ({
  title,
  value,
  hint,
  icon: Icon,
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
      <Icon aria-hidden="true" className="h-4 w-4 text-primary" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-black tracking-tight">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </CardContent>
  </Card>
);

export default function SiteHealthDashboard() {
  const [days, setDays] = useState<number>(7);
  const health = useSiteHealth(days);
  const logs = useAuditLogs(days);
  const rangeLabel = useMemo(() => RANGES.find((r) => r.days === days)?.label ?? `${days} dias`, [days]);

  const loading = health.isLoading || logs.isLoading;

  return (
    <>
      <Helmet>
        <title>Site Health · Admin · Cathedra</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Administração</p>
            <h1 className="font-display text-2xl font-black tracking-tight">Site Health</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Saúde da plataforma, atividade de usuários e trilha de auditoria — janela de {rangeLabel}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {RANGES.map((r) => (
              <Button
                key={r.days}
                size="sm"
                variant={r.days === days ? 'default' : 'outline'}
                onClick={() => setDays(r.days)}
              >
                {r.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              aria-label="Atualizar dados"
              onClick={() => {
                health.refetch();
                logs.refetch();
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Carregando indicadores…
          </div>
        ) : (
          <>
            <section aria-label="Indicadores" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Usuários"
                value={health.data?.totalUsers ?? 0}
                hint={`+${health.data?.newUsers ?? 0} no período`}
                icon={Users}
              />
              <StatCard
                title="Assinantes PRO"
                value={health.data?.premiumUsers ?? 0}
                hint="perfis com acesso premium"
                icon={Users}
              />
              <StatCard
                title="Eventos"
                value={health.data?.events ?? 0}
                hint={`${health.data?.activeSessions ?? 0} sessões distintas`}
                icon={Activity}
              />
              <StatCard
                title="Acessos negados (RLS)"
                value={health.data?.denials ?? 0}
                hint={`${health.data?.securityEvents ?? 0} eventos de segurança`}
                icon={ShieldAlert}
              />
            </section>

            <section className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Eventos mais frequentes</CardTitle>
                </CardHeader>
                <CardContent>
                  {health.data?.topEvents.length ? (
                    <ul className="space-y-2">
                      {health.data.topEvents.map((e) => (
                        <li key={e.name} className="flex items-center justify-between text-sm">
                          <span className="truncate text-foreground/85">{e.name}</span>
                          <span className="font-bold tabular-nums">{e.count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem eventos no período.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Métricas de aplicação</CardTitle>
                </CardHeader>
                <CardContent>
                  {health.data?.metrics.length ? (
                    <ul className="space-y-2">
                      {health.data.metrics.map((m) => (
                        <li key={m.type} className="flex items-center justify-between text-sm">
                          <span className="truncate text-foreground/85">{m.type}</span>
                          <span className="font-bold tabular-nums">{m.count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem métricas no período.</p>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="mt-6">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                <ScrollText aria-hidden="true" className="h-4 w-4" /> Trilha de auditoria
              </h2>
              <Tabs defaultValue="governance">
                <TabsList>
                  <TabsTrigger value="governance">Governança</TabsTrigger>
                  <TabsTrigger value="security">Segurança</TabsTrigger>
                  <TabsTrigger value="denials">Acessos negados</TabsTrigger>
                </TabsList>

                <TabsContent value="governance">
                  {logs.data?.governance.length ? (
                    <ul className="divide-y divide-border rounded-lg border border-border">
                      {logs.data.governance.map((row) => (
                        <li key={row.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 p-3 text-sm">
                          <span className="text-xs tabular-nums text-muted-foreground">{formatDate(row.occurred_at)}</span>
                          <span className="font-semibold">{row.operation}</span>
                          <span className="text-foreground/80">{row.entity_type}</span>
                          <span className="text-xs text-muted-foreground">{row.actor_role ?? 'sem papel'}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="p-3 text-sm text-muted-foreground">Sem registros no período.</p>
                  )}
                </TabsContent>

                <TabsContent value="security">
                  {logs.data?.security.length ? (
                    <ul className="divide-y divide-border rounded-lg border border-border">
                      {logs.data.security.map((row) => (
                        <li key={row.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 p-3 text-sm">
                          <span className="text-xs tabular-nums text-muted-foreground">{formatDate(row.created_at)}</span>
                          <span className="font-semibold">{row.event_type}</span>
                          <span className="text-xs uppercase tracking-wider text-muted-foreground">{row.severity}</span>
                          <span className="text-foreground/80">{row.description}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="p-3 text-sm text-muted-foreground">Sem registros no período.</p>
                  )}
                </TabsContent>

                <TabsContent value="denials">
                  {logs.data?.denials.length ? (
                    <ul className="divide-y divide-border rounded-lg border border-border">
                      {logs.data.denials.map((row) => (
                        <li key={row.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 p-3 text-sm">
                          <span className="text-xs tabular-nums text-muted-foreground">{formatDate(row.created_at)}</span>
                          <span className="font-semibold">{row.table_name}</span>
                          <span className="text-foreground/80">{row.action}</span>
                          <span className="text-xs text-muted-foreground">{row.reason}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="p-3 text-sm text-muted-foreground">Nenhum acesso negado no período.</p>
                  )}
                </TabsContent>
              </Tabs>
            </section>
          </>
        )}
      </section>
    </>
  );
}
