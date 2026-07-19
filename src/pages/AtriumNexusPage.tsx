/**
 * AtriumNexusPage — Etapa 7 (reskin Stitch — Nexus público).
 *
 * Página editorial que apresenta o Nexus Theologicus como um "hub" navegável:
 *  - Hero contemplativo com busca.
 *  - As 7 vozes canônicas do Nexus (bible, catechism, magisterium, father,
 *    saint, journey, theme) usando os presets editoriais existentes
 *    (@/components/cathedra/nexus/nexusPresets).
 *  - Últimas relações tecidas (nexus_relations).
 *  - Contribuições curadas aprovadas (nexus_contributions).
 *  - CTA para contribuir e para o painel de curadoria (/admin/nexus).
 *
 * Regras:
 *  - Só tokens stitch-*, tipografia editorial já ativa no Átrio.
 *  - Reaproveita presets do Nexus (nada de copy inventada).
 *  - Sem novas dependências.
 */

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import {
  Network as Hub,
  Search as SearchIcon,
  ArrowRight as ArrowForward,
  BookOpen,
  BookMarked,
  Landmark,
  Heart,
  GraduationCap,
  Compass,
  Sparkles,
  Feather,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  NEXUS_HEADER,
  NEXUS_EMPTY,
  NEXUS_KIND_PRESETS,
  type NexusKind,
} from '@/components/cathedra/nexus/nexusPresets';

// ─── Ícones canônicos por Kind ───────────────────────────────────────────────
const KIND_ICON: Record<NexusKind, React.ComponentType<{ className?: string }>> = {
  bible: BookOpen,
  catechism: BookMarked,
  magisterium: Landmark,
  father: Feather,
  saint: Heart,
  journey: GraduationCap,
  theme: Sparkles,
};

// Rota canônica de destino ao clicar num Kind (leva à busca filtrada).
const KIND_HREF: Record<NexusKind, string> = {
  bible: '/bible',
  catechism: '/catechism',
  magisterium: '/magisterium',
  father: '/patristica',
  saint: '/santos',
  journey: '/jornadas',
  theme: '/buscar',
};

interface NexusRelationRow {
  id: string;
  relation_type: string;
  source_kind: string;
  target_kind: string;
  source_ref: any;
  target_ref: any;
  note: string | null;
  created_at: string;
}

interface NexusContributionRow {
  id: string;
  book_abbr: string;
  chapter: number;
  verse: number | null;
  connection_type: string;
  reference_title: string;
  summary: string;
  created_at: string;
}

const HERO_KICKER = 'Nexus Theologicus';
const HERO_TITLE = 'A Sinfonia da Verdade';
const HERO_SUBTITLE =
  'Fio a fio, os textos da Tradição respondem uns aos outros. Aqui você percorre a mesma luz que atravessa Escritura, Catecismo, Padres e santos.';

const refLabel = (kind: string, ref: any): string => {
  if (!ref) return '—';
  if (typeof ref === 'string') return ref;
  const r = ref as Record<string, any>;
  if (kind === 'bible') {
    const b = r.book_abbr ?? r.book ?? '';
    const c = r.chapter ?? '';
    const v = r.verse ?? r.verse_start ?? '';
    return [b, c && `${c}${v ? `:${v}` : ''}`].filter(Boolean).join(' ');
  }
  if (kind === 'catechism') return `CIC §${r.paragraph ?? r.p ?? '?'}`;
  return r.title ?? r.slug ?? r.id ?? '—';
};

const AtriumNexusPage: React.FC = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [relations, setRelations] = useState<NexusRelationRow[]>([]);
  const [contribs, setContribs] = useState<NexusContributionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [{ data: rels }, { data: cs }] = await Promise.all([
          (supabase as any)
            .from('nexus_relations')
            .select('id, relation_type, source_kind, target_kind, source_ref, target_ref, note, created_at')
            .order('created_at', { ascending: false })
            .limit(8),
          supabase
            .from('nexus_contributions')
            .select('id, book_abbr, chapter, verse, connection_type, reference_title, summary, created_at')
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(6),
        ]);
        if (cancelled) return;
        setRelations((rels ?? []) as NexusRelationRow[]);
        setContribs((cs ?? []) as NexusContributionRow[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submitSearch = (value: string) => {
    const v = value.trim();
    if (v.length < 2) return;
    navigate(`/buscar?q=${encodeURIComponent(v)}`);
  };

  const kinds = (Object.keys(NEXUS_KIND_PRESETS) as NexusKind[]).sort(
    (a, b) => NEXUS_KIND_PRESETS[a].order - NEXUS_KIND_PRESETS[b].order,
  );

  return (
    <div
      className="min-h-screen w-full bg-stitch-background text-stitch-on-background"
      style={{
        backgroundImage:
          'url("https://www.transparenttextures.com/patterns/p6.png")',
      }}
    >
      <Helmet>
        <title>Cathedra — Nexus Theologicus</title>
        <meta
          name="description"
          content="A sinfonia da Verdade: percorra as conexões entre Escritura, Catecismo, Padres, santos e o Magistério."
        />
        <meta property="og:title" content="Cathedra — Nexus Theologicus" />
        <meta
          property="og:description"
          content="Fio a fio, os textos da Tradição respondem uns aos outros."
        />
        <link rel="canonical" href="https://cathedradigital.com.br/nexus" />
      </Helmet>

      <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-10 md:px-16 md:pt-14 animate-fade-in">
        {/* ─── Hero editorial ─────────────────────────────────────────── */}
        <section className="text-center md:text-left">
          <div className="mb-8 hidden h-px w-full bg-stitch-secondary/30 md:block" />
          <p className="mb-3 font-stitch-body text-[12px] font-bold uppercase tracking-[0.32em] text-stitch-secondary">
            {HERO_KICKER}
          </p>
          <h1 className="mb-3 font-stitch-display text-[32px] italic leading-[40px] text-stitch-primary md:text-[48px] md:leading-[56px] md:tracking-[-0.02em]">
            {HERO_TITLE}
          </h1>
          <p className="mb-8 max-w-2xl font-stitch-body text-[20px] leading-[32px] text-stitch-on-surface-variant md:mx-0 mx-auto">
            {HERO_SUBTITLE}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch(q);
            }}
            className="mx-auto flex max-w-2xl items-center gap-3 border-b-2 border-stitch-primary/80 pb-3 text-left focus-within:border-stitch-secondary md:mx-0"
          >
            <SearchIcon className="h-5 w-5 shrink-0 text-stitch-on-surface-variant" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Que fio deseja puxar hoje?"
              aria-label="Buscar no Nexus"
              className="w-full bg-transparent font-stitch-display text-[18px] italic text-stitch-primary placeholder:text-stitch-on-surface-variant/60 focus:outline-none md:text-[22px]"
            />
            <button
              type="submit"
              className="font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-secondary hover:text-stitch-primary"
            >
              Buscar
            </button>
          </form>
        </section>

        {/* ─── Bento: Introdução + CTA curadoria ───────────────────── */}
        <section className="mt-12 grid grid-cols-1 items-stretch gap-8 md:grid-cols-12">
          <article className="group relative flex h-80 flex-col justify-between overflow-hidden border border-[hsl(var(--stitch-secondary)/0.25)] bg-stitch-surface-container-lowest p-8 transition-all hover:bg-stitch-surface-container-low md:col-span-8">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  'url("https://www.transparenttextures.com/patterns/parchment.png")',
              }}
            />
            <div className="relative z-10 text-left">
              <span className="mb-4 block font-stitch-body text-[12px] font-bold uppercase tracking-[0.2em] text-stitch-secondary">
                {NEXUS_HEADER.eyebrow}
              </span>
              <h2 className="mb-4 font-stitch-display text-[32px] leading-[40px] text-stitch-primary">
                {NEXUS_HEADER.subtitle}
              </h2>
              <p className="max-w-md font-stitch-body text-[18px] leading-[28px] text-stitch-on-surface-variant">
                Cada passagem da Escritura, cada parágrafo do Catecismo e cada
                vida de santo é uma janela para o mesmo mistério. O Nexus tece
                essas janelas em uma única sala.
              </p>
            </div>
            <div className="relative z-10 flex justify-end">
              <Link
                to="/buscar"
                className="inline-flex items-center gap-3 rounded-lg bg-stitch-secondary-container px-8 py-3 font-stitch-body text-[14px] font-medium uppercase tracking-[0.05em] text-stitch-secondary-on-container transition-transform hover:scale-105 active:scale-95"
                style={{
                  boxShadow:
                    '0 0 25px -5px hsl(var(--stitch-secondary-fixed-dim) / 0.4)',
                }}
              >
                <Hub className="h-5 w-5" />
                Explorar por tema
              </Link>
            </div>
            <div className="absolute left-0 top-0 h-0 w-1 bg-stitch-secondary transition-all duration-500 group-hover:h-full" />
          </article>

          <article className="relative flex h-80 flex-col justify-between overflow-hidden border border-stitch-primary-container bg-stitch-primary p-8 text-stitch-primary-foreground md:col-span-4">
            <div className="relative z-10 text-left">
              <span className="font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-secondary-fixed">
                Curadoria
              </span>
              <h3 className="mt-4 font-stitch-display text-[24px] italic leading-tight">
                Contribua com um fio
              </h3>
              <p className="mt-3 font-stitch-body text-[15px] leading-relaxed opacity-80">
                Você percebeu uma conexão nova entre um versículo e a Tradição?
                Envie sua sugestão à curadoria.
              </p>
            </div>
            <div className="relative z-10">
              <div className="mb-4 h-px w-full bg-white/10" />
              <Link
                to="/admin/nexus"
                className="flex items-center justify-between font-stitch-body text-[14px] font-medium uppercase tracking-[0.05em] transition-colors hover:text-stitch-secondary-fixed"
              >
                <span>Painel de curadoria</span>
                <ShieldCheck className="h-5 w-5" />
              </Link>
            </div>
          </article>
        </section>

        {/* ─── 7 Vozes canônicas ──────────────────────────────────────── */}
        <section className="mt-16">
          <div className="mb-8 flex items-center gap-4">
            <Compass className="h-5 w-5 text-stitch-secondary" />
            <h2 className="font-stitch-display text-[24px] font-semibold leading-[32px] text-stitch-primary">
              As vozes que conversam
            </h2>
            <div className="h-px flex-1 bg-stitch-outline-variant/40" />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {kinds.map((kind) => {
              const preset = NEXUS_KIND_PRESETS[kind];
              const Icon = KIND_ICON[kind];
              return (
                <Link
                  key={kind}
                  to={KIND_HREF[kind]}
                  className="group relative flex flex-col justify-between overflow-hidden border border-stitch-outline-variant/40 bg-stitch-surface-container-lowest p-6 transition-all hover:border-stitch-secondary hover:bg-stitch-surface-container-low"
                >
                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-stitch-secondary/40 text-stitch-secondary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-secondary">
                        {preset.eyebrow}
                      </span>
                    </div>
                    {preset.whisper && (
                      <p className="mb-6 font-stitch-display text-[20px] italic leading-[28px] text-stitch-primary">
                        {preset.whisper}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-2 font-stitch-body text-[13px] font-medium uppercase tracking-[0.1em] text-stitch-on-surface-variant transition-colors group-hover:text-stitch-primary">
                    {preset.cta}
                    <ArrowForward className="h-4 w-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ─── Últimas relações tecidas ───────────────────────────────── */}
        <section className="mt-16">
          <div className="mb-8 flex items-center gap-4">
            <Sparkles className="h-5 w-5 text-stitch-secondary" />
            <h2 className="font-stitch-display text-[24px] font-semibold leading-[32px] text-stitch-primary">
              Fios recém-tecidos
            </h2>
            <div className="h-px flex-1 bg-stitch-outline-variant/40" />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse border border-stitch-outline-variant/40 bg-stitch-surface-container-lowest"
                />
              ))}
            </div>
          ) : relations.length === 0 ? (
            <div className="border border-stitch-outline-variant/40 bg-stitch-surface-container-lowest p-10 text-center">
              <p className="font-stitch-display text-[22px] italic text-stitch-primary">
                {NEXUS_EMPTY.title}
              </p>
              <p className="mt-3 font-stitch-body text-[15px] text-stitch-on-surface-variant">
                {NEXUS_EMPTY.body}
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {relations.map((r) => (
                <li
                  key={r.id}
                  className="group flex flex-col gap-3 border border-stitch-outline-variant/40 bg-stitch-surface-container-lowest p-5 transition-colors hover:border-stitch-secondary"
                >
                  <div className="flex items-center gap-3 font-stitch-body text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-secondary">
                    {r.relation_type}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 font-stitch-display text-[18px] italic text-stitch-primary">
                    <span>{refLabel(r.source_kind, r.source_ref)}</span>
                    <ArrowForward className="h-4 w-4 text-stitch-on-surface-variant" />
                    <span>{refLabel(r.target_kind, r.target_ref)}</span>
                  </div>
                  {r.note && (
                    <p className="font-stitch-body text-[14px] leading-[22px] text-stitch-on-surface-variant">
                      {r.note}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ─── Contribuições curadas ──────────────────────────────────── */}
        {contribs.length > 0 && (
          <section className="mt-16">
            <div className="mb-8 flex items-center gap-4">
              <Feather className="h-5 w-5 text-stitch-secondary" />
              <h2 className="font-stitch-display text-[24px] font-semibold leading-[32px] text-stitch-primary">
                Da comunidade, aprovado pela curadoria
              </h2>
              <div className="h-px flex-1 bg-stitch-outline-variant/40" />
            </div>

            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {contribs.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-3 border border-stitch-outline-variant/40 bg-stitch-surface-container-lowest p-6"
                >
                  <span className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-secondary">
                    {c.book_abbr} {c.chapter}
                    {c.verse ? `:${c.verse}` : ''} · {c.connection_type}
                  </span>
                  <h3 className="font-stitch-display text-[20px] leading-[26px] text-stitch-primary">
                    {c.reference_title}
                  </h3>
                  <p className="font-stitch-body text-[14px] leading-[22px] text-stitch-on-surface-variant">
                    {c.summary}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ─── Verso litúrgico ────────────────────────────────────────── */}
        <section className="mt-20 border-t border-stitch-outline-variant/40 pt-10 text-center">
          <p className="font-stitch-display text-[20px] italic leading-[30px] text-stitch-primary md:text-[24px]">
            "Toda Escritura é inspirada por Deus e útil para ensinar."
          </p>
          <p className="mt-2 font-stitch-body text-[12px] font-bold uppercase tracking-[0.2em] text-stitch-secondary">
            2 Timóteo 3,16
          </p>
        </section>
      </main>
    </div>
  );
};

export default AtriumNexusPage;
