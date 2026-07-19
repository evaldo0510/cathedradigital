/**
 * PrayerDetailPage — leitor de uma oração.
 *
 * Sprint CAT-12 item 2. Rota `/oracao/:slug`.
 * - EditorialReaderChrome + hero editorial
 * - Conteúdo em português + latim (quando houver)
 * - Explicação teológica e meditação (quando houver)
 * - Favorito (bible_favorites via useDevotionalFavorites)
 * - ReaderContinuation (kind='prayer') sugerindo próxima oração
 * - Referências: Bíblia, Catecismo, santos, glossário
 */
import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, Star, Clock, BookOpen, Church } from 'lucide-react';
import EditorialReaderChrome from '@/components/editorial/EditorialReaderChrome';
import { MobileTopBar } from '@/components/mobile/MobileTopBar';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import ReaderContinuation from '@/components/shared/ReaderContinuation';
import { usePrayer, usePrayers, PRAYER_CATEGORY_LABEL } from '@/hooks/usePrayers';
import { useDevotionalFavorites } from '@/hooks/useDevotionalFavorites';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PrayerDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { prayer, loading, error } = usePrayer(slug);
  const { prayers } = usePrayers();
  const { items: favorites, add, remove } = useDevotionalFavorites('prayer');

  const isFavorite = useMemo(
    () => (prayer ? favorites.some((f) => f.content_id === prayer.id) : false),
    [favorites, prayer],
  );

  const nextInCategory = useMemo(() => {
    if (!prayer) return undefined;
    const same = prayers.filter((p) => p.category === prayer.category);
    const idx = same.findIndex((p) => p.id === prayer.id);
    if (idx < 0 || idx === same.length - 1) return undefined;
    return same[idx + 1];
  }, [prayer, prayers]);

  const toggleFavorite = async () => {
    if (!prayer) return;
    if (isFavorite) {
      const fav = favorites.find((f) => f.content_id === prayer.id);
      if (fav) {
        await remove(fav.id);
        toast.success('Removida dos favoritos');
      }
    } else {
      await add({
        contentType: 'prayer',
        contentId: prayer.id,
        title: prayer.title,
        content: prayer.content,
        url: `/oracao/${prayer.slug}`,
        metadata: { category: prayer.category },
      });
      toast.success('Adicionada aos favoritos');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-stitch-on-surface-variant">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="font-stitch-body text-sm">Carregando oração…</span>
      </div>
    );
  }

  if (error || !prayer) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-stitch-body text-sm text-destructive">
          {error ?? 'Oração não encontrada.'}
        </p>
        <Link
          to="/oracao"
          className="mt-4 inline-block font-stitch-body text-sm font-semibold uppercase tracking-widest text-stitch-secondary hover:underline"
        >
          Voltar ao Livro de Orações
        </Link>
      </div>
    );
  }

  const kicker = prayer.kicker ?? `Cathedra · ${PRAYER_CATEGORY_LABEL[prayer.category]}`;

  return (
    <>
      <MobileTopBar kicker={kicker} title={prayer.title} showBack />
      <EditorialReaderChrome
        kicker={kicker}
        title={prayer.title}
        subtitle={prayer.subtitle ?? undefined}
        backHref="/oracao"
      />

      <main className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-8 md:px-8 md:pt-12">
        <header className="mb-10 text-center">
          <p className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
            {kicker}
          </p>
          <h1 className="mt-3 font-stitch-display text-4xl md:text-5xl leading-tight text-stitch-on-surface">
            {prayer.title}
          </h1>
          {prayer.subtitle && (
            <p className="mx-auto mt-3 max-w-[52ch] font-stitch-body text-base text-stitch-on-surface-variant italic">
              {prayer.subtitle}
            </p>
          )}
          <div className="mt-6 flex items-center justify-center gap-4 text-stitch-on-surface-variant">
            <span className="inline-flex items-center gap-1.5 font-stitch-body text-xs uppercase tracking-widest">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {Math.max(1, Math.round(prayer.estimated_seconds / 60))} min
            </span>
            <button
              type="button"
              onClick={toggleFavorite}
              aria-pressed={isFavorite}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-stitch-body text-xs uppercase tracking-widest transition-colors',
                isFavorite
                  ? 'border-stitch-secondary bg-stitch-secondary/10 text-stitch-secondary'
                  : 'border-stitch-outline-variant/40 text-stitch-on-surface-variant hover:border-stitch-secondary/50 hover:text-stitch-on-surface',
              )}
            >
              <Star className={cn('h-3.5 w-3.5', isFavorite && 'fill-current')} aria-hidden />
              {isFavorite ? 'Favorita' : 'Favoritar'}
            </button>
          </div>
        </header>

        {/* Texto principal */}
        <section aria-labelledby="prayer-text">
          <h2 id="prayer-text" className="sr-only">
            Texto da oração
          </h2>
          <p className="whitespace-pre-line font-stitch-display text-2xl leading-[1.55] text-stitch-on-surface md:text-[26px]">
            {prayer.content}
          </p>
        </section>

        {/* Latim */}
        {prayer.content_latin && (
          <section aria-labelledby="prayer-latin" className="mt-10 border-t border-stitch-outline-variant/30 pt-8">
            <h2
              id="prayer-latin"
              className="mb-3 font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary"
            >
              Em latim
            </h2>
            <p className="whitespace-pre-line font-stitch-display text-xl italic leading-[1.55] text-stitch-on-surface-variant">
              {prayer.content_latin}
            </p>
          </section>
        )}

        {/* Explicação */}
        {prayer.explanation && (
          <section aria-labelledby="prayer-expl" className="mt-10 border-t border-stitch-outline-variant/30 pt-8">
            <h2
              id="prayer-expl"
              className="mb-3 font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary"
            >
              Explicação
            </h2>
            <p className="font-stitch-body text-base leading-relaxed text-stitch-on-surface">
              {prayer.explanation}
            </p>
          </section>
        )}

        {/* Meditação */}
        {prayer.meditation && (
          <section aria-labelledby="prayer-med" className="mt-10 border-t border-stitch-outline-variant/30 pt-8">
            <h2
              id="prayer-med"
              className="mb-3 font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary"
            >
              Meditação
            </h2>
            <p className="font-stitch-body text-base leading-relaxed text-stitch-on-surface">
              {prayer.meditation}
            </p>
          </section>
        )}

        {/* Referências */}
        {(prayer.related_bible.length > 0 ||
          prayer.related_catechism.length > 0 ||
          prayer.source_ref) && (
          <section aria-labelledby="prayer-refs" className="mt-10 border-t border-stitch-outline-variant/30 pt-8">
            <h2
              id="prayer-refs"
              className="mb-4 font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary"
            >
              Referências
            </h2>
            <ul className="space-y-2 font-stitch-body text-sm">
              {prayer.related_bible.map((ref) => (
                <li key={`b-${ref}`} className="flex items-center gap-2 text-stitch-on-surface">
                  <BookOpen className="h-4 w-4 text-stitch-on-surface-variant" aria-hidden />
                  <Link to={`/bible?q=${encodeURIComponent(ref)}`} className="hover:text-stitch-secondary hover:underline">
                    {ref}
                  </Link>
                </li>
              ))}
              {prayer.related_catechism.map((n) => (
                <li key={`c-${n}`} className="flex items-center gap-2 text-stitch-on-surface">
                  <Church className="h-4 w-4 text-stitch-on-surface-variant" aria-hidden />
                  <Link to={`/catechism?p=${n}`} className="hover:text-stitch-secondary hover:underline">
                    Catecismo §{n}
                  </Link>
                </li>
              ))}
              {prayer.source_ref && (
                <li className="text-stitch-on-surface-variant">Fonte: {prayer.source_ref}</li>
              )}
            </ul>
          </section>
        )}

        {/* Continuidade */}
        <div className="mt-16">
          <ReaderContinuation
            context={{
              kind: 'prayer',
              id: prayer.slug,
              meta: {
                nextPrayerSlug: nextInCategory?.slug,
                prayerCategory: prayer.category,
              },
            }}
          />
        </div>
      </main>

      <MobileBottomNav />
    </>
  );
};

export default PrayerDetailPage;
