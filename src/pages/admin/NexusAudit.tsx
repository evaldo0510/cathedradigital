/**
 * /admin/nexus-audit — Onda A do Cathedra Index.
 *
 * Auditoria em tempo real do grafo sacramental: cada verbete-chave é medido
 * contra o padrão Nexus Ouro (≈20 arestas distribuídas entre 10 dimensões).
 *
 * Não escreve nada — só lê `glossary` e `nexus_relations`.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/constants';
import { resolveNexusHref } from '@/lib/nexusHref';


// -------- Padrão Nexus Ouro --------
const GOLD_TOTAL = 20;

/** Dimensões avaliadas + mínimo esperado. */
const GOLD_SHAPE: Array<{ key: string; label: string; min: number; match: (r: RelationRow) => boolean }> = [
  { key: 'bible', label: 'Bíblia', min: 3, match: r => r.target_kind === 'bible_verse' },
  { key: 'cic', label: 'Catecismo', min: 3, match: r => r.target_kind === 'catechism_paragraph' },
  { key: 'magisterio', label: 'Magistério', min: 2, match: r => r.target_kind === 'magisterium_doc' },
  { key: 'patristica', label: 'Patrística', min: 2, match: r => r.target_kind === 'patristic' },
  { key: 'verbetes', label: 'Verbetes irmãos', min: 3, match: r => tKind(r) === 'glossary' },
  { key: 'jornada', label: 'Jornada', min: 1, match: r => tKind(r) === 'journey' },
  { key: 'oracao', label: 'Orações', min: 2, match: r => tKind(r) === 'prayer' },
  { key: 'santo', label: 'Santos', min: 2, match: r => tKind(r) === 'saint' },
  { key: 'liturgia', label: 'Liturgia', min: 1, match: r => tKind(r) === 'liturgy' },
  { key: 'missal', label: 'Missal', min: 1, match: r => tKind(r) === 'missal' },
];

function tKind(r: RelationRow): string | undefined {
  if (r.target_kind !== 'other') return undefined;
  return (r.target_ref as any)?.kind;
}

// -------- Escopo: grafo sacramental --------
const SACRAMENTAL_SLUGS = [
  'sacramento',
  'batismo',
  'crisma',
  'eucaristia',
  'confissao',
  'uncao-dos-enfermos',
  'ordem',
  'matrimonio',
];

interface GlossaryRow {
  slug: string;
  term: string;
  status: string;
  editorial_completeness: string | null;
}
interface RelationRow {
  source_ref: any;
  target_kind: string;
  target_ref: any;
}

interface AuditRow {
  slug: string;
  term: string;
  status: string;
  completeness: string | null;
  total: number;
  gap: number;
  dimensions: Array<{ key: string; label: string; count: number; min: number; ok: boolean }>;
  goldOk: boolean;
}

export default function NexusAuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [g, n] = await Promise.all([
          supabase
            .from('glossary')
            .select('slug, term, status, editorial_completeness')
            .in('slug', SACRAMENTAL_SLUGS),
          supabase
            .from('nexus_relations')
            .select('source_ref, target_kind, target_ref'),
        ]);
        if (g.error) throw g.error;
        if (n.error) throw n.error;

        const glossaryBySlug = new Map<string, GlossaryRow>();
        (g.data ?? []).forEach((r: any) => glossaryBySlug.set(r.slug, r));

        const relsBySlug = new Map<string, RelationRow[]>();
        (n.data ?? []).forEach((r: any) => {
          const slug = r?.source_ref?.slug;
          if (!slug || !SACRAMENTAL_SLUGS.includes(slug)) return;
          const list = relsBySlug.get(slug) ?? [];
          list.push(r);
          relsBySlug.set(slug, list);
        });

        const audit: AuditRow[] = SACRAMENTAL_SLUGS.map(slug => {
          const gRow = glossaryBySlug.get(slug);
          const rels = relsBySlug.get(slug) ?? [];
          const dimensions = GOLD_SHAPE.map(d => {
            const count = rels.filter(d.match).length;
            return { key: d.key, label: d.label, count, min: d.min, ok: count >= d.min };
          });
          const total = rels.length;
          const goldOk = total >= GOLD_TOTAL && dimensions.every(d => d.ok);
          return {
            slug,
            term: gRow?.term ?? slug,
            status: gRow?.status ?? 'missing',
            completeness: gRow?.editorial_completeness ?? null,
            total,
            gap: Math.max(0, GOLD_TOTAL - total),
            dimensions,
            goldOk,
          };
        });
        setRows(audit);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const summary = useMemo(() => {
    const gold = rows.filter(r => r.goldOk).length;
    const draft = rows.filter(r => r.status === 'draft').length;
    const totalEdges = rows.reduce((s, r) => s + r.total, 0);
    return { gold, draft, totalEdges, count: rows.length };
  }, [rows]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8" data-space="claustro">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cathedra Index · Onda A</p>
        <h1 className="mt-2 text-3xl font-serif">Auditoria do Grafo Sacramental</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Verifica em tempo real se cada verbete-chave atinge o padrão Nexus Ouro:
          ≥{GOLD_TOTAL} arestas distribuídas nas 10 dimensões editoriais.
        </p>
      </header>

      <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cathedra Index · Integridade Editorial</p>
          <p className="mt-1 text-sm">Verbetes marcados como <code>complete</code> mas com campos vitais vazios (interpretação profunda, bibliografia, FAQ) ou densidade Nexus abaixo do Ouro.</p>
        </div>
        <a href="/admin/editorial-integrity" className="shrink-0 text-sm font-medium underline underline-offset-4">
          Abrir painel →
        </a>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {error && <p className="text-sm text-destructive">Erro: {error}</p>}

      {!loading && !error && (
        <>
          {/* Sumário */}
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryCard label="Verbetes" value={summary.count} />
            <SummaryCard label="Nexus Ouro" value={`${summary.gold} / ${summary.count}`} tone={summary.gold === summary.count ? 'ok' : 'warn'} />
            <SummaryCard label="Drafts" value={summary.draft} tone={summary.draft === 0 ? 'ok' : 'warn'} />
            <SummaryCard label="Arestas totais" value={summary.totalEdges} />
          </div>

          {/* Tabela detalhada */}
          <div className="space-y-3">
            {rows.map(r => (
              <Card key={r.slug} className="overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                  <div>
                    <CardTitle className="text-lg">
                      <Link to={resolveNexusHref('glossary', r.slug) ?? '#'} className="hover:underline">
                        {r.term}
                      </Link>
                    </CardTitle>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <StatusBadge status={r.status} />
                      {r.completeness && (
                        <Badge variant="outline" className="text-[10px]">
                          {r.completeness}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {r.goldOk ? (
                        <Icons.Check className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Icons.AlertCircle className="h-5 w-5 text-amber-500" />
                      )}
                      <span className="text-2xl font-bold">{r.total}</span>
                      <span className="text-xs text-muted-foreground">/ {GOLD_TOTAL}</span>
                    </div>
                    {r.gap > 0 && (
                      <p className="text-[11px] text-amber-600">faltam {r.gap}</p>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                    {r.dimensions.map(d => (
                      <div
                        key={d.key}
                        className={`rounded-md border px-2 py-1.5 text-xs ${
                          d.ok
                            ? 'border-emerald-500/20 bg-emerald-500/5'
                            : 'border-amber-500/30 bg-amber-500/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{d.label}</span>
                          <span className={d.ok ? 'text-emerald-600' : 'text-amber-600'}>
                            {d.count}/{d.min}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  tone?: 'ok' | 'warn' | 'neutral';
}) {
  const toneCls =
    tone === 'ok'
      ? 'border-emerald-500/30 bg-emerald-500/5'
      : tone === 'warn'
        ? 'border-amber-500/30 bg-amber-500/5'
        : 'border-border';
  return (
    <div className={`rounded-lg border p-4 ${toneCls}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'published') return <Badge className="bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/20">publicado</Badge>;
  if (status === 'draft') return <Badge className="bg-amber-500/20 text-amber-700 hover:bg-amber-500/20">rascunho</Badge>;
  if (status === 'missing') return <Badge variant="destructive">ausente</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}
