import React, { useEffect, useMemo, useRef } from 'react';
import { trackCollectionEvent } from '@/features/collections/collectionAnalytics';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  BookOpen,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
  Clock,
  GraduationCap,
  Layers,
  Play,
  BookMarked,
  Church,
  Sparkles,
  ScrollText,
  Users,
  Landmark,
  HandHeart,
  Map as MapIcon,
  Lock,
  Award,
} from 'lucide-react';
import { EditorialSurface } from '@/components/editorial';
import {
  ReaderShell,
  EditorialHero,
  NexusPanel,
  StudyContext,
} from '@/components/reader';
import { ReaderContinuation } from '@/components/shared/ReaderContinuation';
import { resolveCollectionAutoNexus } from '@/core/knowledge/adapters/collectionAutoNexus';
import { useCollection } from '@/features/collections/useCollection';
import { useCollectionProgress } from '@/features/collections/useCollectionProgress';
import { collectionAutoNexus } from '@/features/collections/collectionAutoNexus';
import { CollectionProgressBar } from '@/features/collections/CollectionProgressBar';
import { CollectionCompletionCTA } from '@/features/collections/CollectionCompletionCTA';
import type {
  CollectionItem,
  CollectionItemType,
  CollectionLevel,
  CollectionProgressStatus,
} from '@/features/collections/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TYPE_ICON: Record<CollectionItemType, React.ComponentType<{ className?: string }>> = {
  bible: BookMarked,
  catechism: BookOpen,
  saint: Users,
  saint_work: ScrollText,
  magisterium: Landmark,
  prayer: HandHeart,
  liturgy: Church,
  glossary: Sparkles,
  journey: MapIcon,
};

const TYPE_LABEL: Record<CollectionItemType, string> = {
  bible: 'Escritura',
  catechism: 'Catecismo',
  saint: 'Santo',
  saint_work: 'Escrito',
  magisterium: 'Magistério',
  prayer: 'Oração',
  liturgy: 'Liturgia',
  glossary: 'Glossário',
  journey: 'Jornada',
};

const STATUS_LABEL: Record<CollectionProgressStatus, string> = {
  not_started: 'Não iniciado',
  reading: 'Em leitura',
  meditating: 'Em meditação',
  completed: 'Concluído',
};

const LEVEL_LABEL: Record<CollectionLevel, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

function formatDuration(minutes?: number): string | null {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

interface ItemRowProps {
  item: CollectionItem;
  index: number;
  status: CollectionProgressStatus;
  href: string | null;
  locked?: boolean;
  /** Nome do item anterior que precisa ser concluído para desbloquear. */
  blockingItemLabel?: string | null;
  onOpen: () => void;
  onToggleComplete: () => void;
}

const ItemRow: React.FC<ItemRowProps> = ({
  item,
  index,
  status,
  href,
  locked = false,
  blockingItemLabel = null,
  onOpen,
  onToggleComplete,
}) => {
  const Icon = TYPE_ICON[item.item_type] ?? BookOpen;
  const done = status === 'completed';
  const started = status === 'reading' || status === 'meditating';
  const short = (item.metadata?.short as string) ?? item.description_override ?? '';

  return (
    <EditorialSurface
      tier="lowest"
      as="article"
      className={cn(
        'flex items-start gap-spacing-md p-spacing-md transition-colors',
        done && 'bg-primary/5',
        locked && 'opacity-70',
      )}
      aria-disabled={locked || undefined}
      data-locked={locked || undefined}
      data-testid="collection-item-row"
    >
      {/* Número + ícone */}
      <div className="flex flex-col items-center gap-spacing-2xs flex-shrink-0 pt-1">
        <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            done
              ? 'bg-primary text-primary-foreground'
              : locked
                ? 'bg-muted text-muted-foreground'
                : 'bg-primary/10 text-primary',
          )}
          aria-hidden
        >
          {locked ? <Lock className="w-4 h-4" /> : <Icon className="w-5 h-5" />}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 space-y-spacing-2xs">
        <div className="flex items-center gap-spacing-xs flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
            {TYPE_LABEL[item.item_type]}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest',
              done && 'text-primary',
              started && 'text-muted-foreground',
              !done && !started && 'text-muted-foreground/60',
            )}
          >
            {done ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
            {STATUS_LABEL[status]}
          </span>
          {locked && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400"
              data-testid="collection-item-lock-badge"
            >
              <Lock className="w-3 h-3" aria-hidden />
              Bloqueado
            </span>
          )}
        </div>
        <h3 className="font-serif text-premium-md md:text-premium-lg text-foreground leading-tight">
          {item.title_override ?? item.item_slug.replace(/-/g, ' ')}
        </h3>
        {short && (
          <p className="text-premium-sm text-muted-foreground leading-relaxed line-clamp-2">
            {short}
          </p>
        )}

        {locked && blockingItemLabel && (
          <p
            className="text-premium-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-md px-spacing-xs py-spacing-2xs inline-flex items-start gap-1"
            data-testid="collection-item-lock-reason"
          >
            <Lock className="w-3 h-3 mt-[2px] flex-shrink-0" aria-hidden />
            <span>
              Conclua <strong className="font-semibold">{blockingItemLabel}</strong> para desbloquear este conteúdo.
            </span>
          </p>
        )}

        <div className="flex items-center gap-spacing-md pt-spacing-2xs">
          {locked ? (
            <span className="text-premium-xs text-muted-foreground italic">
              Trilha guiada — ordem obrigatória
            </span>
          ) : href ? (
            <Link
              to={href}
              onClick={onOpen}
              className="inline-flex items-center gap-1 text-premium-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              {done ? 'Reler' : started ? 'Continuar' : 'Abrir'}
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="text-premium-xs text-muted-foreground italic">
              Conteúdo em preparação
            </span>
          )}
          {!locked && (
            <button
              type="button"
              onClick={onToggleComplete}
              className="text-premium-xs text-muted-foreground hover:text-primary underline underline-offset-4"
              aria-pressed={done}
            >
              {done ? 'Desmarcar' : 'Marcar como concluído'}
            </button>
          )}
        </div>
      </div>
    </EditorialSurface>
  );
};

/**
 * CollectionPage — trilha de formação guiada (Sprint Coleções Temáticas · Onda 1).
 *
 * Hero editorial (capa opcional, kicker, título, subtítulo)
 *   → Ficha da jornada (nível, duração, nº conteúdos, meta editorial)
 *   → Barra de progresso agregada + CTA "Começar / Continuar"
 *   → Lista numerada de itens (mistura de módulos) com marcar-como-lido
 *
 * Nenhuma migração; consome `collections`/`collection_items`/`collection_progress`.
 */
export default function CollectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useCollection(slug);
  const collectionId = data?.collection.id;
  const {
    progress,
    startItem,
    completeItem,
    getStatus,
  } = useCollectionProgress(collectionId);

  const nexus = useMemo(
    () => (data ? collectionAutoNexus(data.items) : []),
    [data],
  );
  const hrefBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of nexus) m.set(`${n.kind}:${n.id}`, n.href);
    return m;
  }, [nexus]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return <Navigate to="/404" replace />;
  }

  const { collection, items } = data;
  const meta = collection.metadata ?? {};
  const eyebrow = meta.eyebrow ?? 'COLEÇÃO';
  const level =
    (collection.difficulty_level as CollectionLevel | undefined) ??
    (meta.level as CollectionLevel | undefined);
  const duration = formatDuration(
    collection.estimated_reading_time_minutes ?? meta.estimated_minutes,
  );
  const editorialGoal = meta.editorial_goal;
  const heroQuote = collection.hero_quote ?? null;
  const heroQuoteAuthor = collection.hero_quote_author ?? null;
  const learningObjectives = collection.learning_objectives ?? [];
  const completionMessage = collection.completion_message ?? null;

  const totalCompleted = Object.values(progress).filter(
    (p) => p.status === 'completed',
  ).length;
  const totalStarted = Object.values(progress).filter(
    (p) => p.status !== 'not_started',
  ).length;

  // Bloqueios por is_locked_until_prev — mapeia também qual item anterior está barrando.
  const lockedItemIds = new Set<string>();
  const blockingLabelById = new Map<string, string>();
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const prev = items[i - 1];
    if (it.is_locked_until_prev && prev && getStatus(prev.id) !== 'completed') {
      lockedItemIds.add(it.id);
      blockingLabelById.set(
        it.id,
        prev.title_override ?? prev.item_slug.replace(/-/g, ' '),
      );
    }
  }

  const prerequisites = collection.prerequisites ?? [];

  // Próximo item pendente (ignora bloqueados) para o CTA principal
  const nextItem =
    items.find(
      (i) => getStatus(i.id) !== 'completed' && !lockedItemIds.has(i.id),
    ) ?? items[0];
  const nextHref = nextItem
    ? hrefBySlug.get(`${nextItem.item_type}:${nextItem.item_slug}`) ?? null
    : null;
  const ctaLabel =
    totalCompleted === items.length && items.length > 0
      ? 'Reler coleção'
      : totalStarted > 0
        ? 'Continuar coleção'
        : 'Começar coleção';

  const handleStartCta = () => {
    if (nextItem && getStatus(nextItem.id) === 'not_started') {
      void startItem(nextItem.id).catch(() => undefined);
    }
  };

  return (
    <>
      <Helmet>
        <title>{collection.title} · Cathedra</title>
        <meta
          name="description"
          content={
            editorialGoal ??
            collection.subtitle ??
            collection.description ??
            `Coleção ${collection.title} — Cathedra Digital.`
          }
        />
        <meta property="og:title" content={collection.title} />
        <meta
          property="og:description"
          content={editorialGoal ?? collection.subtitle ?? collection.description ?? ''}
        />
        <meta property="og:type" content="article" />
        {collection.cover && <meta property="og:image" content={collection.cover} />}
      </Helmet>

      <ReaderShell
        className="min-h-screen"
        contentMaxWidth="max-w-5xl"
        ariaLabel={`Coleção — ${collection.title}`}
        hero={
          <EditorialHero
            kicker={eyebrow}
            title={collection.title}
            subtitle={collection.subtitle ?? undefined}
            parchment
            {...(collection.cover ? { imageUrl: collection.cover } : {})}
          />
        }
        nexus={
          <NexusPanel
            output={resolveCollectionAutoNexus({
              slug: collection.slug,
              title: collection.title,
              themes: [collection.subtitle, collection.description].filter(
                (t): t is string => Boolean(t),
              ),
            })}
            kicker={`Conexões · ${collection.title}`}
          />
        }
        continuation={
          <ReaderContinuation
            context={{
              kind: 'journey-step',
              id: collection.slug,
              meta: { theme: collection.title },
            }}
          />
        }
        headerContext={
          items.length > 0 ? (
            <StudyContext
              collectionTitle={collection.title}
              position={`${totalCompleted} de ${items.length} concluídos`}
            />
          ) : undefined
        }
      >
        {/* Ficha editorial + CTA */}
        <section className="rounded-2xl border border-border/60 bg-card/40 p-spacing-lg space-y-spacing-md">
          <div className="flex flex-wrap items-center gap-spacing-md">
            {level && (
              <span className="inline-flex items-center gap-spacing-2xs text-premium-xs text-foreground">
                <GraduationCap className="w-4 h-4 text-primary/70" aria-hidden />
                <span className="font-medium">{LEVEL_LABEL[level]}</span>
              </span>
            )}
            {duration && (
              <span className="inline-flex items-center gap-spacing-2xs text-premium-xs text-foreground">
                <Clock className="w-4 h-4 text-primary/70" aria-hidden />
                <span className="font-medium">{duration} de leitura</span>
              </span>
            )}
            <span className="inline-flex items-center gap-spacing-2xs text-premium-xs text-foreground">
              <Layers className="w-4 h-4 text-primary/70" aria-hidden />
              <span className="font-medium">
                {items.length} {items.length === 1 ? 'conteúdo' : 'conteúdos'}
              </span>
            </span>
          </div>

          {heroQuote && (
            <blockquote className="border-l-2 border-primary/40 pl-spacing-md italic font-serif text-premium-md text-foreground/90 leading-relaxed max-w-2xl">
              “{heroQuote}”
              {heroQuoteAuthor && (
                <footer className="mt-spacing-2xs not-italic text-premium-xs text-muted-foreground">
                  — {heroQuoteAuthor}
                </footer>
              )}
            </blockquote>
          )}

          {(editorialGoal || collection.description) && (
            <p className="font-serif text-premium-md text-muted-foreground leading-relaxed max-w-2xl">
              {editorialGoal ?? collection.description}
            </p>
          )}

          {learningObjectives.length > 0 && (
            <div className="space-y-spacing-2xs">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
                Objetivos da trilha
              </h2>
              <ul className="space-y-spacing-2xs">
                {learningObjectives.map((obj, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-spacing-xs text-premium-sm text-foreground/90"
                  >
                    <CheckCircle2
                      className="w-4 h-4 text-primary/60 flex-shrink-0 mt-[3px]"
                      aria-hidden
                    />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {prerequisites.length > 0 && (
            <PrerequisitesBlock
              prerequisites={prerequisites}
              collection={collection}
              itemsTotal={items.length}
              itemsCompleted={totalCompleted}
            />
          )}

          {items.length > 0 && (
            <>
              <CollectionProgressBar completed={totalCompleted} total={items.length} />
              <div className="flex flex-wrap items-center gap-spacing-md pt-spacing-2xs">
                {nextHref ? (
                  <Button asChild size="lg" onClick={handleStartCta}>
                    <Link to={nextHref}>
                      <Play className="w-4 h-4 mr-2" aria-hidden />
                      {ctaLabel}
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" disabled>
                    <Play className="w-4 h-4 mr-2" aria-hidden />
                    {ctaLabel}
                  </Button>
                )}
                {collection.certificate_eligible && (
                  <Button asChild variant="outline" size="lg">
                    <Link to={`/colecoes/${collection.slug}/certificado`}>
                      <Award className="w-4 h-4 mr-2" aria-hidden />
                      {totalCompleted === items.length ? 'Ver certificado' : 'Status do certificado'}
                    </Link>
                  </Button>
                )}
                {totalStarted > 0 && nextItem && (
                  <span className="text-premium-xs text-muted-foreground">
                    Próximo: <span className="font-medium text-foreground">
                      {nextItem.title_override ?? nextItem.item_slug.replace(/-/g, ' ')}
                    </span>
                  </span>
                )}
              </div>
            </>
          )}
        </section>

        {/* Lista numerada */}
        <ol className="space-y-spacing-sm mt-spacing-lg">
          {items.map((item, idx) => {
            const status = getStatus(item.id);
            const href = hrefBySlug.get(`${item.item_type}:${item.item_slug}`) ?? null;
            const locked = lockedItemIds.has(item.id);
            return (
              <li key={item.id}>
                <ItemRow
                  item={item}
                  index={idx}
                  status={status}
                  href={href}
                  locked={locked}
                  blockingItemLabel={blockingLabelById.get(item.id) ?? null}
                  onOpen={() => {
                    if (status === 'not_started') {
                      void startItem(item.id).catch(() => undefined);
                    }
                  }}
                  onToggleComplete={() => {
                    if (status === 'completed') {
                      void startItem(item.id).catch(() => undefined);
                    } else {
                      void completeItem(item.id).catch(() => undefined);
                    }
                  }}
                />
              </li>
            );
          })}
        </ol>

        {/* Reflexão final + recomendações Nexus (100% concluído) */}
        {items.length > 0 && totalCompleted === items.length && (
          <CollectionCompletionCTA
            collection={collection}
            reflection={completionMessage ?? meta.final_reflection}
          />
        )}
      </ReaderShell>
    </>
  );
}


// ─────────────────────────────────────────────────────────────────────
// PrerequisitesBlock — Lista de pré-requisitos + telemetria de visualização.
// Dispara `collection_prerequisites_viewed` uma vez quando a seção aparece
// na viewport (IntersectionObserver). Fallback: dispara no mount se o
// IO não estiver disponível.
// ─────────────────────────────────────────────────────────────────────
interface PrerequisitesBlockProps {
  prerequisites: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collection: any;
  itemsTotal: number;
  itemsCompleted: number;
}

const PrerequisitesBlock: React.FC<PrerequisitesBlockProps> = ({
  prerequisites,
  collection,
  itemsTotal,
  itemsCompleted,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const emittedRef = useRef(false);

  useEffect(() => {
    if (emittedRef.current) return;
    const emit = () => {
      if (emittedRef.current) return;
      emittedRef.current = true;
      trackCollectionEvent('collection_prerequisites_viewed', {
        collection_id: collection.id,
        collection_slug: collection.slug,
        collection_title: collection.title,
        category: collection.category,
        difficulty_level: collection.difficulty_level ?? null,
        estimated_reading_time_minutes:
          collection.estimated_reading_time_minutes ?? null,
        items_total: itemsTotal,
        items_completed: itemsCompleted,
        has_certificate: Boolean(collection.certificate_eligible),
        extra: { prerequisites_count: prerequisites.length },
      });
    };

    if (typeof IntersectionObserver === 'undefined' || !ref.current) {
      emit();
      return;
    }
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            emit();
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [collection, itemsTotal, itemsCompleted, prerequisites.length]);

  return (
    <div
      ref={ref}
      className="space-y-spacing-2xs"
      data-testid="collection-prerequisites"
    >
      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
        Pré-requisitos recomendados
      </h2>
      <ul className="space-y-spacing-2xs">
        {prerequisites.map((pr, i) => (
          <li
            key={i}
            className="flex items-start gap-spacing-xs text-premium-sm text-foreground/90"
          >
            <Lock
              className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-[4px]"
              aria-hidden
            />
            <span>{pr}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
