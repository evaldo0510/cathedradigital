/**
 * PrayerDetailPage — leitor de uma oração.
 *
 * Sprint CAT-12 item 2. Rota `/oracao/:slug`.
 * - ReaderShell (Reader Template Master) + hero editorial
 * - Conteúdo em português + latim (quando houver)
 * - Explicação teológica e meditação (quando houver)
 * - Favorito (bible_favorites via useDevotionalFavorites)
 * - ReaderContinuation (kind='prayer') sugerindo próxima oração
 * - Referências: Bíblia, Catecismo, santos, glossário
 *
 * C0.3.a — Prayer Engine unificado ao Reader Template Master.
 * Zero uso de EditorialReaderChrome; toda leitura passa por ReaderShell.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Loader2, Star, Clock, BookOpen, Church, ArrowLeft, Minus, Plus } from 'lucide-react';
import { ReaderShell, ReaderContinuation } from '@/components/reader';
import { MobileTopBar } from '@/components/mobile/MobileTopBar';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { usePrayer, usePrayers, PRAYER_CATEGORY_LABEL } from '@/hooks/usePrayers';
import { useDevotionalFavorites } from '@/hooks/useDevotionalFavorites';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import PrayerEngineReader from '@/components/cathedra/PrayerEngineReader';
import { usePrayerHierarchy } from '@/prayer-engine/usePrayerHierarchy';
import BreviaryHourInline from '@/components/cathedra/BreviaryHourInline';
import { EditorialHero } from '@/components/editorial/harmony';
import PrayerPortal from '@/components/prayer/PrayerPortal';
import { resolvePortalTheme } from '@/lib/prayer/portalTheme';
import PoenitentiaPage from '@/components/cathedra/PoenitentiaPage';
import PrayerErrorBoundary from '@/components/prayer/PrayerErrorBoundary';
import { useAuth } from '@/hooks/useAuth';
import { logPrayerDiagnostics, serializeSearchParams, type PrayerErrorContext } from '@/lib/prayer/telemetry';


const FONT_STEPS = [
  { key: 'sm', label: 'A', textClass: 'text-xl md:text-[22px]', latinClass: 'text-lg' },
  { key: 'md', label: 'A', textClass: 'text-2xl md:text-[26px]', latinClass: 'text-xl' },
  { key: 'lg', label: 'A', textClass: 'text-[28px] md:text-[30px]', latinClass: 'text-2xl' },
  { key: 'xl', label: 'A', textClass: 'text-[32px] md:text-[34px]', latinClass: 'text-[26px]' },
] as const;
type FontStepKey = typeof FONT_STEPS[number]['key'];
const FONT_STORAGE_KEY = 'cathedra:prayer:font-size';

const PrayerDetailPageInner: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { prayer, loading, error } = usePrayer(slug);
  const { prayers } = usePrayers();
  const { items: favorites, toggle } = useDevotionalFavorites('prayer');
  const sectionSlug = searchParams.get('set') ?? undefined;
  const hierarchy = usePrayerHierarchy(slug, sectionSlug);
  const { user } = useAuth();

  const [fontKey, setFontKey] = useState<FontStepKey>('md');
  useEffect(() => {
    const stored = localStorage.getItem(FONT_STORAGE_KEY) as FontStepKey | null;
    if (stored && FONT_STEPS.some((s) => s.key === stored)) setFontKey(stored);
  }, []);
  const fontStep = FONT_STEPS.find((s) => s.key === fontKey) ?? FONT_STEPS[1];
  const fontIndex = FONT_STEPS.findIndex((s) => s.key === fontKey);
  const changeFont = (delta: number) => {
    const next = FONT_STEPS[Math.min(FONT_STEPS.length - 1, Math.max(0, fontIndex + delta))];
    setFontKey(next.key);
    localStorage.setItem(FONT_STORAGE_KEY, next.key);
  };

  const fromLiturgia = searchParams.get('from') === 'liturgia';

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
    try {
      await toggle({
        contentType: 'prayer',
        contentId: prayer.id,
        title: prayer.title,
        content: prayer.content,
        url: `/oracao/${prayer.slug}`,
        metadata: { category: prayer.category },
      });
      toast.success(isFavorite ? 'Removida dos favoritos' : 'Adicionada aos favoritos');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar favorito';
      if (msg === 'auth-required') {
        toast.error('Entre para salvar favoritos.');
      } else {
        toast.error(msg);
      }
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

  // Sprint 1.0 — Prayer Engine v2: conteúdo servido 100% pelo banco hierárquico.
  const engineV2 = (prayer as { engine_version?: number }).engine_version === 2;
  const isLegacy = searchParams.get('legacy') === '1';

  // Sprint 3 — Onda B: orações `breviario-*` injetam Próprio do dia inline.
  const prayerMeta = (prayer as unknown as { meta?: { auto_injects_proper?: boolean } }).meta;
  if (!isLegacy && prayer.slug.startsWith('breviario-') && prayerMeta?.auto_injects_proper) {
    return <BreviaryHourInline prayer={prayer} />;
  }

  if (engineV2 && !isLegacy) {
    if (hierarchy.loading) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center gap-2 text-stitch-on-surface-variant">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-stitch-body text-sm">Preparando o motor de oração…</span>
        </div>
      );
    }
    if (hierarchy.blocks.length > 0 && hierarchy.hierarchy) {
      const engineKicker = hierarchy.activeSection
        ? `Cathedra · ${prayer.title} · ${hierarchy.activeSection.title}`
        : kicker;

      // B.2.5.d — Portal de Oração universal. Todas orações v2 passam pelo
      // limiar contemplativo (`?enter=1`) com tema/ícone/quote resolvidos.
      const enterRequested = searchParams.get('enter') === '1';
      const themeInfo = resolvePortalTheme(prayer.slug);
      // Rosário mantém propriedade especial (mistérios + activeSection);
      // demais orações usam o portal genérico com highlight de duração.
      if (!enterRequested) {
        if (prayer.slug === 'rosario') {
          return (
            <PrayerPortal
              prayer={prayer}
              activeSection={hierarchy.activeSection}
              mysteries={hierarchy.hierarchy.mysteries}
              kicker={engineKicker}
              theme={themeInfo.theme}
              accentIcon={themeInfo.accentIcon}
              quote={themeInfo.quote}
            />
          );
        }
        return (
          <PrayerPortal
            prayer={prayer}
            kicker={engineKicker}
            theme={themeInfo.theme}
            accentIcon={themeInfo.accentIcon}
            quote={themeInfo.quote}
            showRhythm={false}
            highlight={{
              eyebrow: PRAYER_CATEGORY_LABEL[prayer.category],
              title: hierarchy.activeSection?.title ?? prayer.title,
              subtitle: prayer.subtitle ?? undefined,
              meta: [
                {
                  label: 'Duração',
                  value: `${Math.max(1, Math.round(prayer.estimated_seconds / 60))} min`,
                  icon: 'clock',
                },
              ],
            }}
          />
        );
      }


      // Reader especializado: Exame de Consciência preserva a tela guiada
      // interativa (checkboxes por passo) mesmo entrando pelo Portal v2.
      if (prayer.slug === 'exame-de-consciencia') {
        return <PoenitentiaPage prayer={prayer} kicker={engineKicker} />;
      }

      return (
        <PrayerEngineReader
          prayer={prayer}
          blocks={hierarchy.blocks}
          mysteries={hierarchy.hierarchy.mysteries}
          activeSection={hierarchy.activeSection}
          kicker={engineKicker}
        />
      );
    }
  }

  // Fallback estático (texto/latim/explicação) para orações ainda não migradas
  // ao Prayer Engine v2. Sem persistência local: apenas leitura contínua.




  return (
    <>
      <MobileTopBar kicker={kicker} title={prayer.title} showBack />
      <ReaderShell
        contentMaxWidth="max-w-[720px]"
        ariaLabel={prayer.title}
        hero={
          <EditorialHero align="center" as="header">
            <EditorialHero.Eyebrow>{kicker}</EditorialHero.Eyebrow>
            <EditorialHero.Title>{prayer.title}</EditorialHero.Title>
            {prayer.subtitle && (
              <EditorialHero.Subtitle>{prayer.subtitle}</EditorialHero.Subtitle>
            )}
            <EditorialHero.Meta>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {Math.max(1, Math.round(prayer.estimated_seconds / 60))} min
              </span>
            </EditorialHero.Meta>
            <EditorialHero.Actions>
              <Button
                type="button"
                variant={isFavorite ? 'pill-toned' : 'pill'}
                size="pill"
                onClick={toggleFavorite}
                aria-pressed={isFavorite}
              >
                <Star className={cn('h-3.5 w-3.5', isFavorite && 'fill-current')} aria-hidden />
                {isFavorite ? 'Favorita' : 'Favoritar'}
              </Button>
              {fromLiturgia && (
                <Button asChild variant="pill" size="pill">
                  <Link to="/liturgia">
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                    Voltar para Liturgia
                  </Link>
                </Button>
              )}
              <div
                role="group"
                aria-label="Tamanho da fonte"
                className="inline-flex items-center gap-1 rounded-full border border-stitch-outline-variant/40 p-1"
              >
                <Button
                  type="button"
                  variant="pill"
                  size="pill-sm"
                  onClick={() => changeFont(-1)}
                  disabled={fontIndex === 0}
                  aria-label="Diminuir fonte"
                  className="border-transparent text-stitch-on-surface-variant hover:bg-stitch-secondary/10 hover:text-stitch-on-surface"
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden />
                </Button>
                <span
                  className="min-w-[28px] text-center font-stitch-body text-xs uppercase tracking-widest text-stitch-on-surface-variant"
                  aria-live="polite"
                >
                  {fontKey.toUpperCase()}
                </span>
                <Button
                  type="button"
                  variant="pill"
                  size="pill-sm"
                  onClick={() => changeFont(1)}
                  disabled={fontIndex === FONT_STEPS.length - 1}
                  aria-label="Aumentar fonte"
                  className="border-transparent text-stitch-on-surface-variant hover:bg-stitch-secondary/10 hover:text-stitch-on-surface"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            </EditorialHero.Actions>
          </EditorialHero>
        }
        continuation={
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
        }
      >
        {/* Texto principal */}
        <section aria-labelledby="prayer-text">
          <h2 id="prayer-text" className="sr-only">
            Texto da oração
          </h2>
          <ol className="space-y-6 list-none">
            {prayer.content.split(/\n\s*\n/).filter((p) => p.trim().length > 0).map((paragraph, i) => (
              <li key={i} className="group relative pl-10">
                <span
                  aria-hidden
                  className="absolute left-0 top-1 select-none font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-secondary/60"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className={cn('whitespace-pre-line font-stitch-display leading-[1.55] text-stitch-on-surface', fontStep.textClass)}>
                  {paragraph}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Latim */}
        {prayer.content_latin && (
          <section aria-labelledby="prayer-latin" className="border-t border-stitch-outline-variant/30 pt-8">
            <h2
              id="prayer-latin"
              className="mb-3 font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary"
            >
              Em latim
            </h2>
            <p className={cn('whitespace-pre-line font-stitch-display italic leading-[1.55] text-stitch-on-surface-variant', fontStep.latinClass)}>
              {prayer.content_latin}
            </p>
          </section>
        )}

        {/* Explicação */}
        {prayer.explanation && (
          <section aria-labelledby="prayer-expl" className="border-t border-stitch-outline-variant/30 pt-8">
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
          <section aria-labelledby="prayer-med" className="border-t border-stitch-outline-variant/30 pt-8">
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
          <section aria-labelledby="prayer-refs" className="border-t border-stitch-outline-variant/30 pt-8">
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
      </ReaderShell>

      <MobileBottomNav />
    </>
  );
};

/**
 * Wrapper com Error Boundary contextual — captura React #300 e outros
 * crashes durante o carregamento da hierarquia/portal contemplativo,
 * enviando slug + params + estado de hierarquia para telemetria.
 */
const PrayerDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const context: PrayerErrorContext = useMemo(
    () => ({
      slug: slug ?? null,
      searchParams: serializeSearchParams(searchParams),
      userId: user?.id ?? null,
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
    }),
    [slug, searchParams, user?.id],
  );

  useEffect(() => {
    logPrayerDiagnostics('PrayerDetailPage:mount', context);
  }, [context]);

  return (
    <PrayerErrorBoundary context={context}>
      <PrayerDetailPageInner />
    </PrayerErrorBoundary>
  );
};

export default PrayerDetailPage;
