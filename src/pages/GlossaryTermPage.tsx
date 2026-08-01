/**
 * GlossaryTermPage — Reader editorial do Léxico Teológico (SEG-2 Onda 2).
 *
 * Rota: /glossario/:slug
 *
 * Template oficial da Enciclopédia Católica Viva. Renderiza um verbete
 * completo com o chrome editorial Logos 2030 e todas as seções previstas
 * na Onda 2: definição curta, definição completa, contexto histórico,
 * interpretação, aplicação, Meditação Logos, referências (Bíblia,
 * Catecismo, Magistério, Santos, Padres, Liturgia, Oração, Jornada),
 * FAQ, próximos passos, Nexus completo e bibliografia. Além disso,
 * Favoritar, Compartilhar (via chrome), registro em user_history e
 * rodapé de versão/revisão teológica.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EditorialShell, EditorialHero, EditorialDivider } from '@/components/editorial';
import {
  EditorialKicker,
  EditorialEmptyState,
  EditorialGoldMarker,
  EditorialQuote,
} from '@/components/editorial/primitives';
import {
  ReaderShell,
  ReaderToolbar,
  NexusPanel,
  ReaderContinuation,
} from '@/components/reader';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';
import { resolveAutoNexus } from '@/core/knowledge/adapters/glossaryAutoNexus';
import { BUCKET_LABEL, type ReaderNexusBucket } from '@/core/knowledge/adapters/ReaderAutoNexus';
import { EditorialClosure } from '@/components/reader';
import { resolveEditorialClosure } from '@/lib/editorial/resolveClosure';

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

type SectionKey =
  | 'definition'
  | 'context'
  | 'interpretation'
  | 'application'
  | 'meditation'
  | 'bible'
  | 'catechism'
  | 'magisterium'
  | 'saints'
  | 'fathers'
  | 'liturgy'
  | 'prayer'
  | 'journey'
  | 'faq'
  | 'next_steps'
  | 'nexus'
  | 'bibliography';

interface NexusRef {
  kind?: string;
  target?: string;
  note?: string;
  label?: string;
}

import {
  sanitizeFaqItemsDetailed,
  buildFaqPageJsonLd,
  explainFaqSanitization,
  validateFaqJsonLdLive,
  type FaqItem,
  type FaqSanitizationDiff,
  type SanitizeFaqStats,
} from '@/lib/glossary/sanitizeFaq';
import { reportFaqMetrics } from '@/lib/glossary/faqMetrics';
import { FaqVirtualList } from '@/components/glossary/FaqVirtualList';



interface NextStep {
  label: string;
  href?: string;
  description?: string;
}

interface BibliographyItem {
  title: string;
  author?: string;
  year?: string | number;
  url?: string;
}

interface GlossaryTerm {
  id: string;
  slug: string | null;
  term: string;
  category: string | null;
  short_definition: string | null;
  definition: string;
  etymology: string | null;
  historical_context: string | null;
  interpretation: string | null;
  deep_interpretation: string | null;
  practical_application: string | null;
  logos_meditation: string | null;
  bible_verses: string[] | null;
  catechism_references: string[] | null;
  magisterium_references: string[] | null;
  saints_refs: string[] | null;
  fathers_refs: string[] | null;
  liturgy_refs: string[] | null;
  prayer_refs: string[] | null;
  journey_refs: string[] | null;
  nexus_refs: NexusRef[] | null;
  faq: FaqItem[] | null;
  next_steps: NextStep[] | null;
  bibliography: BibliographyItem[] | null;
  sections_order: string[] | null;
  status: string | null;
  editorial_completeness: 'complete' | 'expanding' | 'reviewed_theologically' | null;
  version: number | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  updated_at: string;
}

const COMPLETENESS_META: Record<
  'complete' | 'expanding' | 'reviewed_theologically',
  { label: string; dot: string; ring: string; text: string }
> = {
  complete: {
    label: 'Completo',
    dot: 'bg-emerald-500',
    ring: 'border-emerald-500/50 bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  expanding: {
    label: 'Em expansão',
    dot: 'bg-amber-500',
    ring: 'border-amber-500/50 bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-300',
  },
  reviewed_theologically: {
    label: 'Revisado teologicamente',
    dot: 'bg-sky-500',
    ring: 'border-sky-500/50 bg-sky-500/10',
    text: 'text-sky-700 dark:text-sky-300',
  },
};

function CompletenessBadge({
  value,
  className,
}: {
  value: GlossaryTerm['editorial_completeness'];
  className?: string;
}) {
  const key = value ?? 'expanding';
  const meta = COMPLETENESS_META[key];
  if (!meta) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full border',
        'font-stitch-label text-stitch-label-sm uppercase tracking-[0.18em]',
        meta.ring,
        meta.text,
        className,
      )}
      title={`Grau editorial: ${meta.label}`}
      aria-label={`Grau editorial do verbete: ${meta.label}`}
    >
      <span className={cn('h-2 w-2 rounded-full', meta.dot)} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

const DEFAULT_ORDER: SectionKey[] = [
  'definition',
  'context',
  'interpretation',
  'application',
  'meditation',
  'faq',
  'next_steps',
  'bibliography',
];

/**
 * Após a Reader Architecture Rule (COS §10 / v1.1), as antigas seções
 * per-kind (bible/catechism/magisterium/saints/fathers/liturgy/prayer/
 * journey/nexus) foram consolidadas em um ÚNICO `NexusPanel` renderizado
 * pelo slot `nexus` do `ReaderShell`. Elas continuam válidas em
 * `sections_order` do banco por compatibilidade, mas são filtradas aqui.
 */
const EDITORIAL_ONLY = new Set<SectionKey>(DEFAULT_ORDER);

const SECTION_META: Record<SectionKey, { kicker: string; title: string; anchor: string }> = {
  definition: { kicker: 'I · Fundamento', title: 'Definição', anchor: 'definicao' },
  context: { kicker: 'II · Origem', title: 'Contexto histórico', anchor: 'contexto' },
  interpretation: { kicker: 'III · Contemplação', title: 'Interpretação teológica', anchor: 'interpretacao' },
  application: { kicker: 'IV · Vida', title: 'Aplicação prática', anchor: 'aplicacao' },
  meditation: { kicker: 'V · Logos', title: 'Meditação Logos', anchor: 'meditacao' },
  faq: { kicker: 'VI · Perguntas', title: 'Perguntas frequentes', anchor: 'faq' },
  next_steps: { kicker: 'VII · Continuar', title: 'Próximos passos', anchor: 'proximos-passos' },
  bibliography: { kicker: 'VIII · Fontes', title: 'Bibliografia', anchor: 'bibliografia' },
  // Chaves legadas — não renderizadas (filtradas por EDITORIAL_ONLY).
  bible: { kicker: '', title: '', anchor: '' },
  catechism: { kicker: '', title: '', anchor: '' },
  magisterium: { kicker: '', title: '', anchor: '' },
  saints: { kicker: '', title: '', anchor: '' },
  fathers: { kicker: '', title: '', anchor: '' },
  liturgy: { kicker: '', title: '', anchor: '' },
  prayer: { kicker: '', title: '', anchor: '' },
  journey: { kicker: '', title: '', anchor: '' },
  nexus: { kicker: '', title: '', anchor: '' },
};

/** Ordem canônica dos buckets no NexusPanel (Escritura → Doutrina → Vida). */
const NEXUS_ORDER: readonly ReaderNexusBucket[] = [
  'bible',
  'catechism',
  'magisterium',
  'father',
  'saint',
  'liturgy',
  'prayer',
  'journey',
  'glossary',
];

/* ------------------------------------------------------------------ */
/* Data hook                                                           */
/* ------------------------------------------------------------------ */

function useGlossaryTerm(slug: string | undefined) {
  const [term, setTerm] = useState<GlossaryTerm | null>(null);
  const [rawFaq, setRawFaq] = useState<unknown>(null);
  const [faqStats, setFaqStats] = useState<SanitizeFaqStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const { data, error: err } = await (supabase as any)
        .from('glossary')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (cancelled) return;

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      if (data) {
        const rawFaqValue = (data as any).faq;
        const sanitized = sanitizeFaqItemsDetailed(rawFaqValue, slug);
        setTerm({ ...(data as any), faq: sanitized.items } as GlossaryTerm);
        setRawFaq(rawFaqValue);
        setFaqStats(sanitized.stats);
        // Métricas (Sentry + gtag) em dev e produção
        reportFaqMetrics({ route: `/glossario/${slug}`, slug }, sanitized.stats);
      } else {
        setTerm(null);
        setRawFaq(null);
        setFaqStats(null);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { term, loading, error, faqStats, rawFaq };
}


/* ------------------------------------------------------------------ */
/* Registro em user_history                                            */
/* ------------------------------------------------------------------ */

function useHistoryRegistration(term: GlossaryTerm | null) {
  useEffect(() => {
    if (!term?.slug) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes?.user?.id;
        if (!userId || cancelled) return;
        await (supabase as any).from('user_history').insert({
          user_id: userId,
          route: `/glossario/${term.slug}`,
          title: term.term,
        });
      } catch {
        /* silencioso — histórico é opcional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [term?.slug, term?.term]);
}

/* ------------------------------------------------------------------ */
/* Renderização auxiliar                                               */
/* ------------------------------------------------------------------ */

function TextSection({ children }: { children: string | null | undefined }) {
  if (!children || !children.trim()) {
    return (
      <EditorialEmptyState
        kicker="Em preparação"
        title="Este trecho ainda está sendo escrito."
        description="O conteúdo teológico será publicado em breve."
      />
    );
  }
  return (
    <div className="prose prose-stitch max-w-[68ch] mx-auto font-stitch-serif text-stitch-body leading-stitch-body text-stitch-ink">
      {children.split(/\n{2,}/).map((para, i) => (
        <p key={i} className="mb-6">
          {para}
        </p>
      ))}
    </div>
  );
}

function MeditationBlock({ children }: { children: string | null | undefined }) {
  if (!children || !children.trim()) {
    return (
      <EditorialEmptyState
        kicker="Em preparação"
        title="Meditação Logos ainda não escrita."
        description="A reflexão contemplativa será publicada em breve."
      />
    );
  }
  return (
    <div className="max-w-[62ch] mx-auto">
      <EditorialQuote className="text-stitch-body-lg md:text-stitch-headline-sm">
        {children}
      </EditorialQuote>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Nexus consolidado — Reader Architecture Rule (COS §10)              */
/* ------------------------------------------------------------------ */
/*                                                                     */
/* As antigas funções `RefList`, `AutoNexusList`, `NexusFullList`      */
/* foram REMOVIDAS. Toda projeção de Nexus do verbete usa agora o      */
/* primitivo canônico `NexusPanel` (via slot `nexus` do ReaderShell).  */
/* Ver: docs/reader-architecture-master.md                             */



function FaqSanitizationBadge({
  stats,
  slug,
}: {
  stats: SanitizeFaqStats | null;
  slug?: string;
}) {
  // Só aparece em dev e quando houve descarte ou normalização
  const isDev =
    typeof import.meta !== 'undefined' &&
    (import.meta as any).env &&
    (import.meta as any).env.DEV;
  if (!isDev || !stats) return null;
  if (stats.dropped === 0 && stats.normalized === 0 && stats.total === 0) return null;

  return (
    <div
      data-testid="faq-sanitization-badge"
      className="max-w-[68ch] mx-auto mb-4 rounded-md border border-dashed border-amber-400/60 bg-amber-50/60 px-4 py-2 text-xs font-mono text-amber-900"
      role="note"
      aria-label="Resumo de sanitização do FAQ (apenas em desenvolvimento)"
    >
      <span className="font-semibold">[dev] FAQ · {slug ?? '?'}</span>{' '}
      total={stats.total} · mantidos={stats.kept} · descartados={stats.dropped} ·
      normalizados={stats.normalized}
    </div>
  );
}

const FAQ_PAGE_SIZE = 20;
const FAQ_PAGINATION_THRESHOLD = 50;
const FAQ_VIRTUALIZATION_THRESHOLD = 100;

function FaqBlock({ items }: { items: FaqItem[] | null | undefined }) {
  const safeItems = items ?? [];
  const [visible, setVisible] = useState(FAQ_PAGE_SIZE);

  if (safeItems.length === 0) {
    return (
      <EditorialEmptyState
        kicker="Em preparação"
        title="Perguntas frequentes ainda não curadas."
        description="Serão publicadas em breve."
      />
    );
  }

  // Virtualização real (react-window) acima do threshold — melhora custo de DOM
  // em glossários com FAQs muito longos (200+). Preserva `<details>` para SEO.
  if (safeItems.length >= FAQ_VIRTUALIZATION_THRESHOLD) {
    return <FaqVirtualList items={safeItems} />;
  }

  const paginate = safeItems.length > FAQ_PAGINATION_THRESHOLD;
  const rendered = paginate ? safeItems.slice(0, visible) : safeItems;
  const hasMore = paginate && visible < safeItems.length;

  return (
    <div className="max-w-[68ch] mx-auto space-y-4">
      {rendered.map((item, i) => {
        const answer = typeof item.answer === 'string' ? item.answer : '';
        const paragraphs = answer.trim() ? answer.split(/\n{2,}/) : [];
        return (
          <details
            key={i}
            className="group border border-stitch-outline-variant/40 rounded-[var(--stitch-radius-xl)] bg-stitch-surface-container-lowest overflow-hidden"
          >
            <summary className="cursor-pointer list-none px-6 py-4 flex items-baseline justify-between gap-4 font-stitch-display italic text-stitch-body-lg text-stitch-on-background hover:text-stitch-secondary transition-colors">
              <span>{item.question}</span>
              <span
                aria-hidden="true"
                className="font-stitch-label text-stitch-label-sm text-stitch-secondary transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="px-6 pb-6 pt-2 font-stitch-serif text-stitch-body text-stitch-on-surface leading-relaxed border-t border-stitch-outline-variant/30">
              {paragraphs.length > 0 ? (
                paragraphs.map((p, k) => (
                  <p key={k} className="mb-3 last:mb-0">
                    {p}
                  </p>
                ))
              ) : (
                <p className="mb-0 italic text-stitch-on-surface-variant">
                  Resposta em preparação.
                </p>
              )}
            </div>
          </details>
        );
      })}
      {hasMore && (
        <div className="pt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + FAQ_PAGE_SIZE)}
            data-testid="faq-load-more"
            className="px-5 py-2 rounded-full border border-stitch-outline-variant/60 bg-stitch-surface-container-lowest text-stitch-label-sm font-stitch-label uppercase tracking-[0.18em] hover:bg-stitch-secondary/10 transition-colors"
            aria-label={`Carregar mais perguntas (${safeItems.length - visible} restantes)`}
          >
            Carregar mais ({safeItems.length - visible})
          </button>
        </div>
      )}
    </div>
  );
}

function NextStepsBlock({ items }: { items: NextStep[] | null | undefined }) {
  if (!items || items.length === 0) {
    return (
      <EditorialEmptyState
        kicker="Em preparação"
        title="Próximos passos ainda não indicados."
        description="Serão publicados em breve."
      />
    );
  }
  return (
    <ul className="max-w-[68ch] mx-auto grid gap-3 md:grid-cols-2">
      {items.map((step, i) => {
        const content = (
          <>
            <span className="font-stitch-label text-stitch-label-sm uppercase tracking-[0.24em] text-stitch-secondary block mb-1">
              Continuar →
            </span>
            <span className="font-stitch-display text-stitch-body-lg text-stitch-on-background block">
              {step.label}
            </span>
            {step.description && (
              <span className="mt-2 font-stitch-body text-stitch-body-sm text-stitch-on-surface-variant block">
                {step.description}
              </span>
            )}
          </>
        );
        return (
          <li key={i}>
            {step.href ? (
              <Link
                to={step.href}
                className="block h-full p-5 border border-stitch-outline-variant/40 rounded-[var(--stitch-radius-xl)] bg-stitch-surface-container-lowest hover:border-stitch-secondary/60 transition-colors"
              >
                {content}
              </Link>
            ) : (
              <div className="p-5 border border-stitch-outline-variant/40 rounded-[var(--stitch-radius-xl)] bg-stitch-surface-container-lowest">
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function BibliographyBlock({ items }: { items: BibliographyItem[] | null | undefined }) {
  if (!items || items.length === 0) {
    return (
      <EditorialEmptyState
        kicker="Em preparação"
        title="Bibliografia ainda não indicada."
        description="Fontes serão publicadas em breve."
      />
    );
  }
  return (
    <ol className="max-w-[68ch] mx-auto space-y-3 font-stitch-serif text-stitch-body-sm text-stitch-on-surface list-decimal list-inside">
      {items.map((b, i) => (
        <li key={i} className="pl-1">
          {b.author && <span className="font-semibold">{b.author}. </span>}
          <em>{b.title}</em>
          {b.year && <span>, {b.year}</span>}
          {b.url && (
            <>
              {' '}
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-stitch-secondary underline decoration-stitch-secondary/40 underline-offset-4 hover:decoration-stitch-secondary"
              >
                ver fonte
              </a>
            </>
          )}
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

const GlossaryTermPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { term, loading, error, faqStats, rawFaq } = useGlossaryTerm(slug);
  const isDevEnv = import.meta.env.DEV;
  const [devMode, setDevMode] = useState<'off' | 'raw' | 'diff' | 'jsonld'>('off');
  const showRawFaq = devMode !== 'off';
  const { toggleFavorite, isFavorite } = useFavorites('glossary');

  // JSON-LD memoizado — evita reconstruir/sanitizar a cada re-render.
  // O `buildFaqPageJsonLd` também cacheia por referência via WeakMap.
  const faqJsonLd = useMemo(() => buildFaqPageJsonLd(term?.faq), [term?.faq]);

  // Diff bruto x sanitizado, calculado só quando o dev abre o painel.
  const faqDiff = useMemo<FaqSanitizationDiff[]>(
    () => (isDevEnv && showRawFaq ? explainFaqSanitization(rawFaq) : []),
    [isDevEnv, showRawFaq, rawFaq],
  );

  useHistoryRegistration(term);

  const order = useMemo<SectionKey[]>(() => {
    const raw = term?.sections_order?.length ? term.sections_order : DEFAULT_ORDER;
    // Reader Architecture Rule: apenas seções editoriais aqui. Conexões
    // teológicas (bible/catechism/magisterium/saints/fathers/liturgy/prayer/
    // journey/nexus) são consolidadas no `NexusPanel` do slot `nexus`.
    return raw.filter((k): k is SectionKey =>
      k in SECTION_META && EDITORIAL_ONLY.has(k as SectionKey),
    );
  }, [term]);

  const autoNexus = useMemo(() => (term ? resolveAutoNexus(term) : null), [term]);

  const nexusPanelOutput = useMemo(() => {
    if (!autoNexus) return null;
    // Adapta `AutoNexusResult.byKind` (kinds semânticos do glossário) para
    // o contrato `ReaderAutoNexusOutput.byBucket` que o NexusPanel consome.
    const byBucket: Partial<Record<ReaderNexusBucket, typeof autoNexus.byKind[string]>> = {};
    for (const bucket of NEXUS_ORDER) {
      const list = autoNexus.byKind[bucket];
      if (list && list.length > 0) byBucket[bucket] = list;
    }
    return {
      selfId: autoNexus.selfId,
      suggestions: [],
      byBucket,
      labels: { ...BUCKET_LABEL, ...autoNexus.labels },
    };
  }, [autoNexus]);


  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="font-stitch-label text-stitch-label-sm uppercase tracking-[0.28em] text-stitch-muted">
          Abrindo verbete…
        </p>
      </div>
    );
  }

  if (error || !term) {
    return (
      <EditorialShell>
        <EditorialEmptyState
          kicker="Verbete não encontrado"
          title="Este verbete ainda não foi publicado."
          description={
            <>
              Talvez o endereço tenha mudado. Voltar ao{' '}
              <Link to="/glossario" className="underline decoration-stitch-secondary underline-offset-4">
                Léxico completo
              </Link>
              .
            </>
          }
          action={
            <button
              type="button"
              onClick={() => navigate('/glossario')}
              className="px-6 py-3 border border-stitch-secondary text-stitch-secondary uppercase tracking-[0.28em] text-stitch-label-sm hover:bg-stitch-secondary/10 transition"
            >
              Ir para o Léxico
            </button>
          }
        />
      </EditorialShell>
    );
  }

  const canonical =
    typeof window !== 'undefined' ? `${window.location.origin}/glossario/${term.slug}` : undefined;
  const heroSubtitle = term.short_definition?.trim() || term.definition.slice(0, 220);
  const description = (term.short_definition ?? term.definition ?? '').slice(0, 155);
  const favorited = isFavorite('glossary', term.term);
  const nexus = autoNexus!;

  const handleFavorite = () => {
    toggleFavorite({
      type: 'glossary',
      title: term.term,
      content: term.slug ? `/glossario/${term.slug}` : '',
    });
  };

  const reviewedAt = term.reviewed_at
    ? new Date(term.reviewed_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <>
      <Helmet>
        <title>{`${term.term} — Léxico Teológico | Cathedra`}</title>
        <meta name="description" content={description} />
        {canonical && <link rel="canonical" href={canonical} />}
        <meta property="og:title" content={`${term.term} — Léxico Teológico`} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        {canonical && <meta property="og:url" content={canonical} />}
        <meta name="twitter:card" content="summary" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'DefinedTerm',
                name: term.term,
                description,
                inDefinedTermSet: {
                  '@type': 'DefinedTermSet',
                  name: 'Léxico Teológico Cathedra',
                  url: 'https://www.cathedradigital.com.br/glossario',
                },
                url: canonical,
                ...(term.category && { termCode: term.category }),
              },
              {
                '@type': 'Article',
                headline: term.term,
                description,
                inLanguage: 'pt-BR',
                articleSection: term.category ?? 'Léxico Teológico',
                url: canonical,
                mainEntityOfPage: canonical,
                dateModified: term.updated_at,
                ...(term.reviewed_at && { dateReviewed: term.reviewed_at }),
                author: { '@type': 'Organization', name: 'Cathedra Digital' },
                publisher: {
                  '@type': 'Organization',
                  name: 'Cathedra Digital',
                  url: 'https://www.cathedradigital.com.br',
                },
              },
              ...(faqJsonLd ? [faqJsonLd] : []),
            ],
          })}
        </script>
      </Helmet>

      <ReaderToolbar
        kicker="Cathedra · Léxico"
        title={term.term}
        subtitle={term.category ?? undefined}
        backHref="/glossario"
        shareUrl={canonical}
      />

      <ReaderShell
        ariaLabel={`Verbete: ${term.term}`}
        contentMaxWidth="max-w-6xl"
        hero={
          <>
            {/* Breadcrumb */}
            <nav aria-label="Trilha de navegação" className="max-w-6xl mx-auto px-4 pt-6">
              <ol className="flex flex-wrap items-center gap-2 font-stitch-label text-stitch-label-sm uppercase tracking-[0.24em] text-stitch-muted">
                <li>
                  <Link to="/glossario" className="hover:text-stitch-secondary transition">
                    Léxico
                  </Link>
                </li>
                {term.category && (
                  <>
                    <li aria-hidden="true" className="text-stitch-muted/50">/</li>
                    <li>
                      <Link
                        to={`/glossario?category=${encodeURIComponent(term.category)}`}
                        className="hover:text-stitch-secondary transition"
                      >
                        {term.category}
                      </Link>
                    </li>
                  </>
                )}
                <li aria-hidden="true" className="text-stitch-muted/50">/</li>
                <li
                  aria-current="page"
                  className="text-stitch-ink normal-case tracking-normal font-stitch-display text-stitch-body-sm"
                >
                  {term.term}
                </li>
              </ol>
            </nav>

            <EditorialHero
              kicker={term.category ? `Léxico · ${term.category}` : 'Léxico Teológico'}
              title={term.term}
              subtitle={heroSubtitle}
              size="md"
              parchment
              action={
                <button
                  type="button"
                  onClick={handleFavorite}
                  aria-pressed={favorited}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 border rounded-full',
                    'font-stitch-label text-stitch-label-sm uppercase tracking-[0.24em] transition-colors',
                    favorited
                      ? 'border-stitch-secondary bg-stitch-secondary/10 text-stitch-secondary'
                      : 'border-stitch-outline-variant/60 text-stitch-on-surface-variant hover:border-stitch-secondary hover:text-stitch-secondary',
                  )}
                >
                  {favorited ? (
                    <>
                      <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
                      Favoritado
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
                      Favoritar
                    </>
                  )}
                </button>
              }
            />

            <div className="max-w-6xl mx-auto px-4 mt-6 flex justify-center">
              <CompletenessBadge value={term.editorial_completeness} />
            </div>
          </>
        }
        nexus={
          nexusPanelOutput && (
            <NexusPanel
              output={nexusPanelOutput}
              order={NEXUS_ORDER}
              title="Nexus Theologicus"
              kicker="Conexões deste verbete"
              className="mx-auto"
            />
          )
        }
        continuation={
          <div className="flex flex-col gap-spacing-2xl">
            {(() => {
              const closure = resolveEditorialClosure(term as unknown as { editorial_closure?: unknown });
              return closure ? <EditorialClosure {...closure} /> : null;
            })()}
            <ReaderContinuation
              context={{
                kind: 'glossary-term',
                id: term.slug ?? term.id,
                meta: { theme: term.category ?? undefined },
              }}
            />
          </div>
        }
      >
        {/* Sumário lateral (desktop) + corpo editorial */}
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
          <nav aria-label="Sumário do verbete" className="hidden lg:block sticky top-32 self-start">
            <EditorialKicker className="mb-4">Sumário</EditorialKicker>
            <ol className="space-y-2 font-stitch-label text-stitch-label-sm uppercase tracking-[0.16em] text-stitch-muted">
              {order.map((k) => (
                <li key={k}>
                  <a href={`#${SECTION_META[k].anchor}`} className="hover:text-stitch-secondary transition">
                    {SECTION_META[k].title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="min-w-0">
            {order.map((k) => {
              const meta = SECTION_META[k];
              return (
                <section
                  key={k}
                  id={meta.anchor}
                  className={cn('scroll-mt-32 py-12 first:pt-0')}
                  aria-labelledby={`${meta.anchor}-title`}
                >
                  <header className="text-center mb-8">
                    <EditorialKicker>{meta.kicker}</EditorialKicker>
                    <h2
                      id={`${meta.anchor}-title`}
                      className="font-stitch-display text-stitch-display-sm md:text-stitch-display-md text-stitch-ink mt-3"
                    >
                      {meta.title}
                    </h2>
                    <div className="mt-4 mx-auto w-16 h-px bg-stitch-secondary" />
                  </header>

                  {k === 'definition' && <TextSection>{term.definition}</TextSection>}
                  {k === 'context' && (
                    <>
                      {term.etymology && (
                        <aside
                          className="max-w-[68ch] mx-auto mb-6 px-5 py-4 border-l-2 border-stitch-secondary/60 bg-stitch-surface/40 rounded-r"
                          aria-label="Etimologia"
                        >
                          <EditorialKicker className="mb-2">Etimologia</EditorialKicker>
                          <p className="font-stitch-serif text-stitch-body-md text-stitch-on-background leading-relaxed">
                            {term.etymology}
                          </p>
                        </aside>
                      )}
                      <TextSection>{term.historical_context}</TextSection>
                    </>
                  )}
                  {k === 'interpretation' && (
                    <TextSection>{term.interpretation ?? term.deep_interpretation}</TextSection>
                  )}
                  {k === 'application' && <TextSection>{term.practical_application}</TextSection>}
                  {k === 'meditation' && <MeditationBlock>{term.logos_meditation}</MeditationBlock>}
                  {k === 'faq' && (
                    <>
                      <FaqSanitizationBadge stats={faqStats} slug={term.slug} />
                      {isDevEnv && (
                        <div
                          className="max-w-[68ch] mx-auto mb-4 flex items-center justify-end gap-2"
                          role="group"
                          aria-label="[dev] Modo de inspeção do FAQ"
                        >
                          {(['off', 'raw', 'diff', 'jsonld'] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setDevMode(mode)}
                              data-testid={`faq-devmode-${mode}`}
                              className={cn(
                                'text-xs font-mono px-3 py-1 rounded border border-dashed transition-colors',
                                devMode === mode
                                  ? 'border-amber-500 bg-amber-100 text-amber-950'
                                  : 'border-amber-500/60 bg-amber-50/40 text-amber-900 hover:bg-amber-100/60',
                              )}
                              aria-pressed={devMode === mode}
                            >
                              [dev]{' '}
                              {mode === 'off'
                                ? 'Ocultar'
                                : mode === 'raw'
                                  ? 'Bruto + Sanitizado'
                                  : mode === 'diff'
                                    ? 'Diff por item'
                                    : 'Preview JSON-LD'}
                            </button>
                          ))}
                        </div>
                      )}
                      {isDevEnv && devMode === 'raw' && (
                        <div
                          data-testid="faq-raw-panel"
                          className="max-w-[68ch] mx-auto mb-6 grid md:grid-cols-2 gap-4 text-xs"
                        >
                          <div className="rounded border border-amber-400/60 bg-amber-50/40 p-3">
                            <div className="font-semibold mb-2 text-amber-900">Original (bruto)</div>
                            <pre className="whitespace-pre-wrap break-words max-h-96 overflow-auto text-amber-950/90">
{JSON.stringify(rawFaq, null, 2)}
                            </pre>
                          </div>
                          <div className="rounded border border-emerald-500/60 bg-emerald-50/40 p-3">
                            <div className="font-semibold mb-2 text-emerald-900">Sanitizado</div>
                            <pre className="whitespace-pre-wrap break-words max-h-96 overflow-auto text-emerald-950/90">
{JSON.stringify(term.faq, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                      {isDevEnv && devMode === 'diff' && (
                        <div
                          data-testid="faq-diff-panel"
                          className="max-w-[68ch] mx-auto mb-6 space-y-3 text-xs"
                        >
                          <div className="flex justify-end">
                            <button
                              type="button"
                              data-testid="faq-diff-export"
                              onClick={() => {
                                const payload = {
                                  slug: term.slug,
                                  generatedAt: new Date().toISOString(),
                                  total: faqDiff.length,
                                  dropped: faqDiff.filter((d) => d.dropped).length,
                                  changed: faqDiff.filter(
                                    (d) => d.questionChanged || d.answerChanged,
                                  ).length,
                                  items: faqDiff,
                                };
                                const blob = new Blob(
                                  [JSON.stringify(payload, null, 2)],
                                  { type: 'application/json' },
                                );
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `faq-diff-${term.slug}-${Date.now()}.json`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              }}
                              className="text-xs font-mono px-3 py-1 rounded border border-dashed border-amber-500/70 bg-amber-50/60 text-amber-950 hover:bg-amber-100/80"
                            >
                              [dev] Exportar diff (JSON)
                            </button>
                          </div>
                          {faqDiff.length === 0 && (
                            <div className="italic text-stitch-on-surface-variant">
                              Nenhum item bruto disponível.
                            </div>
                          )}
                          {faqDiff.map((d) => {
                            const clean =
                              !d.dropped &&
                              !d.questionChanged &&
                              !d.answerChanged &&
                              d.removedFromQuestion.length === 0 &&
                              d.removedFromAnswer.length === 0;
                            return (
                              <div
                                key={d.index}
                                className={cn(
                                  'rounded border p-3',
                                  d.dropped
                                    ? 'border-red-500/70 bg-red-50/60'
                                    : clean
                                      ? 'border-emerald-500/40 bg-emerald-50/30'
                                      : 'border-amber-500/60 bg-amber-50/50',
                                )}
                              >
                                <div className="font-semibold mb-1">
                                  Item #{d.index}{' '}
                                  {d.dropped && <span className="text-red-700">· descartado ({d.reason})</span>}
                                  {clean && <span className="text-emerald-700">· inalterado</span>}
                                </div>
                                {(d.questionChanged || d.removedFromQuestion.length > 0) && (
                                  <div className="mb-1">
                                    <span className="text-amber-800 font-semibold">question:</span>{' '}
                                    <span className="line-through text-red-700">
                                      {String(d.rawQuestion ?? '')}
                                    </span>{' '}
                                    → <span className="text-emerald-800">{d.sanitizedQuestion || '∅'}</span>
                                  </div>
                                )}
                                {(d.answerChanged || d.removedFromAnswer.length > 0) && (
                                  <div className="mb-1">
                                    <span className="text-amber-800 font-semibold">answer:</span>{' '}
                                    <span className="line-through text-red-700">
                                      {String(d.rawAnswer ?? '')}
                                    </span>{' '}
                                    → <span className="text-emerald-800">{d.sanitizedAnswer || '∅'}</span>
                                  </div>
                                )}
                                {(d.removedFromQuestion.length > 0 || d.removedFromAnswer.length > 0) && (
                                  <div className="mt-1 text-red-700">
                                    <span className="font-semibold">Removido:</span>{' '}
                                    {[...d.removedFromQuestion, ...d.removedFromAnswer]
                                      .map((s) => JSON.stringify(s))
                                      .join(' · ')}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {isDevEnv && devMode === 'jsonld' && (() => {
                        const live = validateFaqJsonLdLive(term.faq);
                        const removedPaths = new Set(live.issues.map((i) => i.path));
                        return (
                          <div
                            data-testid="faq-jsonld-panel"
                            className="max-w-[68ch] mx-auto mb-6 space-y-3 text-xs"
                          >
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div
                                className={cn(
                                  'font-mono px-2 py-1 rounded border',
                                  live.ok
                                    ? 'border-emerald-500/60 bg-emerald-50/60 text-emerald-900'
                                    : 'border-red-500/60 bg-red-50/60 text-red-900',
                                )}
                                data-testid="faq-jsonld-status"
                              >
                                {live.ok ? '✓ JSON-LD válido' : '✗ JSON-LD inválido'}
                                {' · '}itens: {live.jsonLd?.mainEntity.length ?? 0}
                                {live.droppedIndices.length > 0 && (
                                  <> · descartados: {live.droppedIndices.length}</>
                                )}
                              </div>
                              <div
                                data-testid="faq-jsonld-policy"
                                className="font-mono text-[11px] px-2 py-1 rounded border border-dashed border-stitch-outline-variant/60 bg-stitch-surface/40 text-stitch-on-surface-variant"
                                title="Versão da política de sanitização aplicada"
                              >
                                policy v{live.policyVersion} · {live.policyEnv}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  data-testid="faq-jsonld-copy"
                                  onClick={() => {
                                    const payload = JSON.stringify(
                                      live.jsonLd ?? { error: live.issues },
                                      null,
                                      2,
                                    );
                                    navigator.clipboard?.writeText(payload).catch(() => {});
                                  }}
                                  className="text-xs font-mono px-3 py-1 rounded border border-dashed border-amber-500/70 bg-amber-50/60 text-amber-950 hover:bg-amber-100/80"
                                >
                                  Copiar JSON-LD
                                </button>
                                <button
                                  type="button"
                                  data-testid="faq-jsonld-export"
                                  onClick={() => {
                                    const payload = {
                                      slug: term.slug,
                                      generatedAt: new Date().toISOString(),
                                      policy: {
                                        version: live.policyVersion,
                                        env: live.policyEnv,
                                        appliedAt: live.appliedAt,
                                      },
                                      ok: live.ok,
                                      jsonLd: live.jsonLd,
                                      removedFields: live.issues.map((i) => ({
                                        path: i.path,
                                        code: i.code,
                                        message: i.message,
                                      })),
                                      droppedIndices: live.droppedIndices,
                                    };
                                    const blob = new Blob(
                                      [JSON.stringify(payload, null, 2)],
                                      { type: 'application/json' },
                                    );
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `faq-jsonld-${term.slug}-${Date.now()}.json`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  }}
                                  className="text-xs font-mono px-3 py-1 rounded border border-dashed border-emerald-500/70 bg-emerald-50/60 text-emerald-950 hover:bg-emerald-100/80"
                                >
                                  Exportar JSON-LD (.json)
                                </button>
                              </div>
                            </div>
                            {live.issues.length > 0 && (
                              <ul
                                data-testid="faq-jsonld-issues"
                                className="rounded border border-red-500/60 bg-red-50/50 p-3 text-red-900 space-y-1"
                              >
                                {live.issues.map((iss, i) => (
                                  <li key={i} className="font-mono">
                                    <span className="font-semibold">{iss.path || '(root)'}</span>{' '}
                                    <span className="text-red-700">[{iss.code}]</span> {iss.message}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {live.droppedIndices.length > 0 && (
                              <div className="rounded border border-amber-500/60 bg-amber-50/50 p-3 text-amber-900">
                                <span className="font-semibold">Itens removidos (índices):</span>{' '}
                                <span className="font-mono">{live.droppedIndices.join(', ')}</span>
                              </div>
                            )}
                            <pre
                              className={cn(
                                'rounded border p-3 whitespace-pre-wrap break-words max-h-[28rem] overflow-auto',
                                live.ok
                                  ? 'border-emerald-500/60 bg-emerald-50/40 text-emerald-950/90'
                                  : 'border-red-500/60 bg-red-50/40 text-red-950/90',
                              )}
                              data-testid="faq-jsonld-output"
                            >
{JSON.stringify(live.jsonLd, null, 2)}
                            </pre>
                            {removedPaths.size > 0 && (
                              <div className="text-[11px] italic text-stitch-on-surface-variant">
                                Paths destacados no schema: {[...removedPaths].join(' · ')}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      <FaqBlock items={term.faq} />
                    </>
                  )}
                  {k === 'next_steps' && <NextStepsBlock items={term.next_steps} />}
                  {k === 'bibliography' && <BibliographyBlock items={term.bibliography} />}
                </section>
              );
            })}

            <EditorialQuote className="my-16" cite="Sto. Tomás de Aquino">
              A palavra do sábio é como uma luz que dissipa as trevas do coração.
            </EditorialQuote>

            {/* Rodapé de versão / revisão teológica (extensão do módulo, não substitui slots) */}
            <footer className="mt-16 pt-8 border-t border-stitch-outline-variant/40 max-w-[68ch] mx-auto">
              <EditorialDivider variant="gold-fade" className="mb-6" />
              <dl className="grid grid-cols-2 md:grid-cols-5 gap-4 font-stitch-label text-stitch-label-sm text-stitch-on-surface-variant uppercase tracking-[0.18em]">
                <div>
                  <dt className="text-stitch-secondary/80">Grau editorial</dt>
                  <dd className="mt-1">
                    <CompletenessBadge value={term.editorial_completeness} />
                  </dd>
                </div>
                <div>
                  <dt className="text-stitch-secondary/80">Versão</dt>
                  <dd className="mt-1 text-stitch-on-background">v{term.version ?? 1}</dd>
                </div>
                <div>
                  <dt className="text-stitch-secondary/80">Status</dt>
                  <dd className="mt-1 text-stitch-on-background">
                    {term.status === 'published'
                      ? 'Publicado'
                      : term.status === 'review'
                      ? 'Em revisão'
                      : 'Rascunho'}
                  </dd>
                </div>
                <div>
                  <dt className="text-stitch-secondary/80">Revisor</dt>
                  <dd className="mt-1 text-stitch-on-background normal-case tracking-normal font-stitch-serif">
                    {term.reviewed_by ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-stitch-secondary/80">Revisão</dt>
                  <dd className="mt-1 text-stitch-on-background normal-case tracking-normal font-stitch-serif">
                    {reviewedAt ?? 'Sem revisão registrada'}
                  </dd>
                </div>
              </dl>
            </footer>
          </div>
        </div>
      </ReaderShell>
    </>
  );
};

export default GlossaryTermPage;

