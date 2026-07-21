import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Droplet,
  Flame,
  Wheat,
  HeartHandshake,
  HandHeart,
  Church,
  Sparkles,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react';
import {
  EditorialHero,
  EditorialSurface,
} from '@/components/editorial';
import { useCollection } from '@/features/collections/useCollection';
import { useCollectionProgress } from '@/features/collections/useCollectionProgress';
import { collectionAutoNexus } from '@/features/collections/collectionAutoNexus';
import type {
  CollectionItem,
  CollectionProgressStatus,
} from '@/features/collections/types';
import { cn } from '@/lib/utils';

const SYMBOL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  droplet: Droplet,
  flame: Flame,
  wheat: Wheat,
  'heart-handshake': HeartHandshake,
  'hand-heart': HandHeart,
  church: Church,
  rings: Sparkles,
};

const STATUS_LABEL: Record<CollectionProgressStatus, string> = {
  not_started: 'Ainda não iniciado',
  reading: 'Em estudo',
  meditating: 'Em meditação',
  completed: 'Concluído',
};

function ItemCard({
  item,
  status,
  href,
  onOpen,
}: {
  item: CollectionItem;
  status: CollectionProgressStatus;
  href: string;
  onOpen: () => void;
}) {
  const symbol = (item.metadata?.symbol as string) ?? 'church';
  const short = (item.metadata?.short as string) ?? '';
  const Icon = SYMBOL_ICONS[symbol] ?? Church;
  const done = status === 'completed';
  const started = status === 'reading' || status === 'meditating';

  return (
    <EditorialSurface
      tier="lowest"
      interactive
      as="article"
      className="flex flex-col gap-4 p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            'bg-stitch-secondary/10 text-stitch-secondary',
          )}
          aria-hidden="true"
        >
          <Icon className="h-6 w-6" />
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-medium',
            done && 'text-stitch-secondary',
            started && 'text-stitch-on-surface-variant',
            !done && !started && 'text-stitch-on-surface-variant/70',
          )}
        >
          {done ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-stitch-label text-stitch-label-sm uppercase tracking-[0.18em] text-stitch-on-surface-variant">
          {String(item.order_index).padStart(2, '0')} · Sacramento
        </span>
        <h3 className="font-stitch-display text-stitch-headline-sm text-stitch-on-background leading-tight capitalize">
          {item.title_override ?? item.item_slug.replace(/-/g, ' ')}
        </h3>
        {short && (
          <p className="text-stitch-body-md text-stitch-on-surface-variant leading-relaxed">
            {short}
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between pt-2">
        <Link
          to={href}
          onClick={onOpen}
          className="inline-flex items-center gap-1 text-sm font-medium text-stitch-secondary hover:underline"
        >
          Abrir estudo
          <ChevronRight className="h-4 w-4" />
        </Link>
        <BookOpen className="h-4 w-4 text-stitch-on-surface-variant/60" aria-hidden="true" />
      </div>
    </EditorialSurface>
  );
}

export default function CollectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useCollection(slug);
  const collectionId = data?.collection.id;
  const { progress, startItem, getStatus } = useCollectionProgress(collectionId);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-stitch-secondary" />
      </div>
    );
  }

  if (error || !data) {
    return <Navigate to="/404" replace />;
  }

  const { collection, items } = data;
  const nexus = collectionAutoNexus(items);
  const eyebrow = (collection.metadata?.eyebrow as string) ?? 'COLEÇÃO';
  const totalCompleted = Object.values(progress).filter(
    (p) => p.status === 'completed',
  ).length;

  return (
    <>
      <Helmet>
        <title>{collection.title} · Cathedra</title>
        <meta
          name="description"
          content={
            collection.subtitle ??
            collection.description ??
            `Coleção ${collection.title} — Cathedra Digital.`
          }
        />
        <meta property="og:title" content={collection.title} />
        <meta
          property="og:description"
          content={collection.subtitle ?? collection.description ?? ''}
        />
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="min-h-screen">
        <EditorialHero
          kicker={eyebrow}
          title={collection.title}
          subtitle={collection.subtitle ?? undefined}
          parchment
        />

        <div className="mx-auto w-full max-w-5xl px-6 pb-24">
          {collection.description && (
            <p className="font-stitch-body text-stitch-body-lg text-stitch-on-surface-variant leading-relaxed max-w-2xl mb-10">
              {collection.description}
            </p>
          )}

          {collectionId && items.length > 0 && (
            <div className="mb-8 flex items-center gap-3 text-sm text-stitch-on-surface-variant">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-stitch-secondary" />
                {totalCompleted} de {items.length} concluídos
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {items.map((item, idx) => {
              const href = nexus[idx]?.href ?? '#';
              return (
                <ItemCard
                  key={item.id}
                  item={item}
                  href={href}
                  status={getStatus(item.id)}
                  onOpen={() => {
                    // marca como "reading" sem bloquear a navegação
                    if (getStatus(item.id) === 'not_started') {
                      void startItem(item.id).catch(() => undefined);
                    }
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
