/**
 * Admin — Trilha de Auditoria (`/admin/audit-logs`).
 *
 * Consolida três fontes já existentes e protegidas por RLS admin-only:
 *  - `governance_audit_log`  → mudanças editoriais/governança (inclui operações
 *    executadas por funções SECURITY DEFINER, via `actor_role`).
 *  - `security_audit_logs`   → eventos de segurança (grants, hardening, scans).
 *  - `rls_denial_events`     → tentativas de acesso negadas por RLS.
 *
 * Somente leitura: filtros, paginação server-side e exportação CSV do
 * conjunto filtrado (até 5.000 linhas).
 */
import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Download,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ScrollText,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type Source = 'governance' | 'security' | 'denials';

interface SourceConfig {
  table: 'governance_audit_log' | 'security_audit_logs' | 'rls_denial_events';
  dateColumn: string;
  columns: string;
  /** Colunas exibidas na tabela (ordem importa). */
  fields: Array<{ key: string; label: string }>;
  /** Colunas usadas pela busca textual (ilike). */
  searchable: string[];
  /** Filtro categórico opcional. */
  facet?: { column: string; label: string; options: string[] };
  /** Coluna do usuário responsável, quando existir (filtro por autor). */
  actorColumn?: string;
  icon: React.ElementType;
  label: string;
  hint: string;
}


const SOURCES: Record<Source, SourceConfig> = {
  governance: {
    table: 'governance_audit_log',
    dateColumn: 'occurred_at',
    columns: 'id, occurred_at, actor_id, actor_role, entity_type, entity_id, operation, correlation_id',
    fields: [
      { key: 'occurred_at', label: 'Data' },
      { key: 'operation', label: 'Operação' },
      { key: 'entity_type', label: 'Entidade' },
      { key: 'entity_id', label: 'ID' },
      { key: 'actor_role', label: 'Papel' },
      { key: 'actor_id', label: 'Autor' },
      { key: 'correlation_id', label: 'Correlação' },
    ],
    searchable: ['entity_type', 'operation', 'correlation_id'],
    facet: {
      column: 'actor_role',
      label: 'Papel do executor',
      options: ['authenticated', 'service_role', 'system', 'anon'],
    },
    actorColumn: 'actor_id',

    icon: ScrollText,
    label: 'Governança',
    hint: 'Alterações registradas por gatilhos e funções SECURITY DEFINER (actor_role = system/service_role).',
  },
  security: {
    table: 'security_audit_logs',
    dateColumn: 'created_at',
    columns: 'id, created_at, event_type, severity, description',
    fields: [
      { key: 'created_at', label: 'Data' },
      { key: 'severity', label: 'Severidade' },
      { key: 'event_type', label: 'Evento' },
      { key: 'description', label: 'Descrição' },
    ],
    searchable: ['event_type', 'description'],
    facet: { column: 'severity', label: 'Severidade', options: ['info', 'warning', 'error', 'critical'] },
    icon: ShieldAlert,
    label: 'Segurança e grants',
    hint: 'Eventos de segurança: revogação/concessão de grants, scans e hardening de policies.',
  },
  denials: {
    table: 'rls_denial_events',
    dateColumn: 'created_at',
    columns: 'id, created_at, user_id, table_name, action, reason',
    fields: [
      { key: 'created_at', label: 'Data' },
      { key: 'table_name', label: 'Tabela' },
      { key: 'action', label: 'Ação' },
      { key: 'reason', label: 'Motivo' },
      { key: 'user_id', label: 'Usuário' },
    ],
    searchable: ['table_name', 'action', 'reason'],
    facet: { column: 'action', label: 'Ação', options: ['select', 'insert', 'update', 'delete'] },
    actorColumn: 'user_id',

    icon: Lock,
    label: 'Negações RLS',
    hint: 'Tentativas de leitura/escrita bloqueadas por Row Level Security.',
  },
};

const PAGE_SIZE = 25;
const CSV_LIMIT = 5000;
const PERIODS = [
  { value: '1', label: 'Últimas 24h' },
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
  { value: '0', label: 'Todo o período' },
];

const sinceIso = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

type Row = Record<string, unknown>;

interface Filters {
  days: number;
  facet: string;
  search: string;
  /** UUID (ou prefixo) do usuário responsável pelo evento. */
  actor: string;
}

/** Severidade normalizada para leitura rápida da trilha. */
type Severity = 'info' | 'warning' | 'critical';

const SEVERITY_LABEL: Record<Severity, string> = {
  info: 'Info',
  warning: 'Atenção',
  critical: 'Crítico',
};

const SEVERITY_CLASS: Record<Severity, string> = {
  info: 'border-border bg-muted text-muted-foreground',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  critical: 'border-destructive/40 bg-destructive/10 text-destructive',
};

function severityOf(source: Source, row: Row): Severity {
  if (source === 'security') {
    const raw = String(row.severity ?? '').toLowerCase();
    if (raw === 'critical' || raw === 'error') return 'critical';
    if (raw === 'warning' || raw === 'warn') return 'warning';
    return 'info';
  }
  if (source === 'denials') {
    const action = String(row.action ?? '').toLowerCase();
    return action === 'select' ? 'warning' : 'critical';
  }
  const op = String(row.operation ?? '').toLowerCase();
  if (op.includes('delete') || op.includes('revoke')) return 'critical';
  if (op.includes('update') || op.includes('publish') || op.includes('grant')) return 'warning';
  return 'info';
}

/**
 * Rota administrativa do recurso relacionado ao evento — atalho para
 * investigar a entidade sem sair da trilha.
 */
const ENTITY_ROUTES: Record<string, (id: string) => string> = {
  nexus_relation: () => '/admin/nexus-audit',
  translation_source: () => '/admin/bible-sources',
  editorial_closure_migration: () => '/admin/editorial-closure-validator',
  glossary: () => '/admin/glossario',
  glossary_term: () => '/admin/glossario',
  saint: () => '/admin/saints',
  saints: () => '/admin/saints',
  prayer: () => '/admin/oracoes',
  catechism: () => '/admin/catechism-queue',
  catechism_official: () => '/admin/catechism-queue',
  collection: (id) => (id ? `/admin/collections/${id}` : '/admin/collections'),
  collections: (id) => (id ? `/admin/collections/${id}` : '/admin/collections'),
  saint_works: () => '/admin/biblioteca-patristica',
};

const TABLE_ROUTES: Record<string, string> = {
  glossary: '/admin/glossario',
  catechism_official: '/admin/catechism-queue',
  saints: '/admin/saints',
  collections: '/admin/collections',
  secret_leaks: '/admin/security-audit',
  community_likes: '/admin/site-health',
};

function relatedHref(source: Source, row: Row): string | null {
  if (source === 'governance') {
    const type = String(row.entity_type ?? '');
    const build = ENTITY_ROUTES[type];
    return build ? build(String(row.entity_id ?? '')) : null;
  }
  if (source === 'denials') {
    return TABLE_ROUTES[String(row.table_name ?? '')] ?? null;
  }
  return null;
}

function buildQuery(source: Source, filters: Filters) {
  const cfg = SOURCES[source];
  // Tabelas resolvidas dinamicamente: os tipos gerados explodem em união
  // profunda demais para o TS, então o builder é tratado de forma opaca.
  const client = supabase as unknown as {
    from: (table: string) => {
      select: (cols: string, opts: { count: 'exact' }) => any;
    };
  };
  let query = client.from(cfg.table).select(cfg.columns, { count: 'exact' });
  if (filters.days > 0) query = query.gte(cfg.dateColumn, sinceIso(filters.days));
  if (filters.facet !== 'all' && cfg.facet) query = query.eq(cfg.facet.column, filters.facet);
  const actor = filters.actor.trim();
  if (actor && cfg.actorColumn) {
    const safeActor = actor.replace(/[,()*%]/g, '');
    if (safeActor) query = query.ilike(`${cfg.actorColumn}::text`, `%${safeActor}%`);
  }
  const term = filters.search.trim();
  if (term) {
    const safe = term.replace(/[,()*]/g, ' ').trim();
    if (safe) query = query.or(cfg.searchable.map((c) => `${c}.ilike.%${safe}%`).join(','));
  }
  return query.order(cfg.dateColumn, { ascending: false }) as {
    range: (from: number, to: number) => Promise<{ data: Row[] | null; count: number | null; error: { message: string } | null }>;
  };
}



function formatCell(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (key.endsWith('_at')) return new Date(String(value)).toLocaleString('pt-BR');
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return text;
}

function toCsv(fields: Array<{ key: string; label: string }>, rows: Row[]): string {
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const head = fields.map((f) => escape(f.label)).join(',');
  const body = rows.map((r) => fields.map((f) => escape(r[f.key])).join(',')).join('\n');
  return `${head}\n${body}`;
}

const AuditTable: React.FC<{ source: Source }> = ({ source }) => {
  const cfg = SOURCES[source];
  // A severidade vira badge dedicado; a coluna crua sai da tabela (segue no CSV).
  const visibleFields = cfg.fields.filter((f) => f.key !== 'severity');
  const colCount = visibleFields.length + 2;
  const [days, setDays] = useState(30);
  const [facet, setFacet] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [actorInput, setActorInput] = useState('');
  const [actor, setActor] = useState('');
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);

  const filters: Filters = useMemo(
    () => ({ days, facet, search, actor }),
    [days, facet, search, actor],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-audit-logs', source, filters, page],
    staleTime: 30_000,
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const { data: rows, count, error } = await buildQuery(source, filters).range(
        from,
        from + PAGE_SIZE - 1,
      );
      if (error) throw error;
      return { rows: (rows ?? []) as unknown as Row[], count: count ?? 0 };
    },
  });

  const total = data?.count ?? 0;
  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
    setActor(actorInput);
  };


  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: rows, error } = await buildQuery(source, filters).range(0, CSV_LIMIT - 1);
      if (error) throw error;
      const csv = toCsv(cfg.fields, (rows ?? []) as unknown as Row[]);
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cfg.table}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${rows?.length ?? 0} registro(s) exportado(s).`);
    } catch (err) {
      toast.error('Falha ao exportar CSV.', { description: String((err as Error)?.message ?? err) });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <cfg.icon aria-hidden="true" className="h-4 w-4 text-primary" />
          {cfg.label}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{cfg.hint}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <form onSubmit={applySearch} className="flex flex-1 flex-col gap-2 sm:flex-row">
            <div className="flex-1">
              <label htmlFor={`search-${source}`} className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Buscar
              </label>
              <Input
                id={`search-${source}`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={cfg.searchable.join(', ')}
              />
            </div>
            {cfg.actorColumn && (
              <div className="sm:w-56">
                <label htmlFor={`actor-${source}`} className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Usuário responsável
                </label>
                <Input
                  id={`actor-${source}`}
                  value={actorInput}
                  onChange={(e) => setActorInput(e.target.value)}
                  placeholder="ID do usuário"
                />
              </div>
            )}
            <Button type="submit" variant="secondary" className="self-end">
              Filtrar
            </Button>
          </form>


          <div className="w-full md:w-44">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Período
            </span>
            <Select
              value={String(days)}
              onValueChange={(v) => {
                setPage(0);
                setDays(Number(v));
              }}
            >
              <SelectTrigger aria-label="Período"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {cfg.facet && (
            <div className="w-full md:w-52">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {cfg.facet.label}
              </span>
              <Select
                value={facet}
                onValueChange={(v) => {
                  setPage(0);
                  setFacet(v);
                }}
              >
                <SelectTrigger aria-label={cfg.facet.label}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {cfg.facet.options.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={handleExport} disabled={exporting || total === 0} className="self-end gap-2">
            <Download aria-hidden="true" className="h-4 w-4" />
            {exporting ? 'Exportando…' : 'CSV'}
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">{cfg.label} — registros de auditoria</caption>
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Severidade
                </th>
                {visibleFields.map((f) => (
                  <th key={f.key} scope="col" className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {f.label}
                  </th>
                ))}
                <th scope="col" className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Recurso
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={colCount} className="px-3 py-6 text-center text-muted-foreground">Carregando…</td></tr>
              )}
              {isError && (
                <tr><td colSpan={colCount} className="px-3 py-6 text-center text-destructive">Falha ao carregar registros.</td></tr>
              )}
              {!isLoading && !isError && (data?.rows.length ?? 0) === 0 && (
                <tr><td colSpan={colCount} className="px-3 py-6 text-center text-muted-foreground">Nenhum registro no filtro atual.</td></tr>
              )}
              {data?.rows.map((row, i) => {
                const severity = severityOf(source, row);
                const href = relatedHref(source, row);
                return (
                  <tr key={String(row.id ?? i)} className="border-t border-border align-top">
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${SEVERITY_CLASS[severity]}`}>
                        {SEVERITY_LABEL[severity]}
                      </span>
                    </td>
                    {visibleFields.map((f) => (
                      <td key={f.key} className="max-w-[280px] truncate px-3 py-2" title={formatCell(f.key, row[f.key])}>
                        {formatCell(f.key, row[f.key])}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      {href ? (
                        <Link
                          to={href}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                          Abrir recurso
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span aria-live="polite">
            {total} registro(s) · página {Math.min(page + 1, maxPage + 1)} de {maxPage + 1}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <ChevronLeft aria-hidden="true" className="h-4 w-4" /> Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page >= maxPage} onClick={() => setPage((p) => p + 1)}>
              Próxima <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AuditLogsPage() {
  const [tab, setTab] = useState<Source>('governance');

  return (
    <>
      <Helmet>
        <title>Trilha de Auditoria · Admin · Cathedra</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Administração</p>
          <h1 className="mt-1 font-display text-2xl font-black tracking-tight text-foreground">
            Trilha de Auditoria
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Governança, segurança e negações de RLS em uma única visão. Filtros por período,
            categoria e texto; exportação CSV do conjunto filtrado (máx. {CSV_LIMIT} linhas).
          </p>
        </header>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Source)}>
          <TabsList className="mb-4">
            {(Object.keys(SOURCES) as Source[]).map((s) => (
              <TabsTrigger key={s} value={s}>{SOURCES[s].label}</TabsTrigger>
            ))}
          </TabsList>
          {(Object.keys(SOURCES) as Source[]).map((s) => (
            <TabsContent key={s} value={s}>
              <AuditTable source={s} />
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </>
  );
}
