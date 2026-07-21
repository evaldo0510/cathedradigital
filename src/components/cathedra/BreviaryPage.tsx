/**
 * BreviaryPage — Liturgia das Horas migrada ao Prayer Engine v2.
 *
 * - Ordinário (invitatório, hino, oração conclusiva, bênção) vem do banco
 *   via `usePrayerHierarchy('liturgia-das-horas')`. Cada uma das 7 horas
 *   canônicas é uma seção hierárquica com seus blocos.
 * - Próprio do dia (antífona, salmodia, leitura breve, responsório,
 *   cântico evangélico, preces, oração conclusiva) é gerado idempotentemente
 *   pela edge function `liturgy-hours-office` a partir das leituras do dia
 *   e cacheado em `liturgy_hours_offices` — mesmo padrão da Onda B.
 * - Persistência, favoritos, marcadores, retomada, ReaderContinuation e
 *   Nexus automático são delegados ao `PrayerEngineReader`.
 * - SEO/JSON-LD via `SEOHead`.
 */
import React, { useMemo, useState } from 'react';
import { usePrayerHierarchy } from '@/prayer-engine/usePrayerHierarchy';
import { usePrayers } from '@/hooks/usePrayers';
import { useDailyLiturgy } from '@/hooks/useDailyLiturgy';
import {
  useLiturgyHoursOffice,
  type HourSlug,
} from '@/hooks/useLiturgyHoursOffice';
import { PrayerEngineReader } from './PrayerEngineReader';
import { LiturgyHoursOfficeCards } from './primitives/liturgy/LiturgyHoursOfficeCards';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Icons } from '../../constants';
import { flattenSectionToBlocks } from '@/prayer-engine/loadPrayerHierarchy';
import SEOHead from '@/components/SEOHead';

const HOUR_ORDER: HourSlug[] = [
  'oficio',
  'laudes',
  'tercia',
  'sexta',
  'noa',
  'vesperas',
  'completas',
];

const HOUR_ICON: Record<HourSlug, React.ReactNode> = {
  oficio:    <Icons.BookOpen className="w-spacing-md h-spacing-md" />,
  laudes:    <Icons.Sun className="w-spacing-md h-spacing-md" />,
  tercia:    <Icons.Clock className="w-spacing-md h-spacing-md" />,
  sexta:     <Icons.Sun className="w-spacing-md h-spacing-md" />,
  noa:       <Icons.Clock className="w-spacing-md h-spacing-md" />,
  vesperas:  <Icons.Sun className="w-spacing-md h-spacing-md" />,
  completas: <Icons.Moon className="w-spacing-md h-spacing-md" />,
};

function suggestedHourFor(now: Date): HourSlug {
  const h = now.getHours();
  if (h < 6) return 'oficio';
  if (h < 9) return 'laudes';
  if (h < 11) return 'tercia';
  if (h < 14) return 'sexta';
  if (h < 17) return 'noa';
  if (h < 20) return 'vesperas';
  return 'completas';
}

const BreviaryPage: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const isoDate = today.toISOString().slice(0, 10);
  const suggested = useMemo(() => suggestedHourFor(today), [today]);

  const [selectedHour, setSelectedHour] = useState<HourSlug | null>(null);

  const { hierarchy, activeSection, blocks, loading } = usePrayerHierarchy(
    'liturgia-das-horas',
    selectedHour ?? undefined,
  );
  const { prayers } = usePrayers();
  const prayer = useMemo(
    () => prayers.find((p) => p.slug === 'liturgia-das-horas') ?? null,
    [prayers],
  );

  const { liturgy } = useDailyLiturgy(today);
  const { office, isLoading: officeLoading } = useLiturgyHoursOffice(
    isoDate,
    selectedHour,
    liturgy,
  );

  // Reader ativo
  if (selectedHour && prayer && hierarchy && activeSection) {
    // Recalcula blocos garantindo pertencer à hora selecionada (defesa contra
    // pickSectionForDay caindo em outra seção quando o slug bate).
    const section =
      hierarchy.sections.find((s) => s.slug === selectedHour) ?? activeSection;
    const hourBlocks = flattenSectionToBlocks(hierarchy, section);

    return (
      <>
        <SEOHead
          title={`${section.title} · Liturgia das Horas — Cathedra`}
          description={`Reze ${section.title} (${section.subtitle ?? ''}) da Liturgia das Horas com o Próprio do dia gerado a partir da liturgia católica.`}
          path="/breviary"
        />
        <PrayerEngineReader
          prayer={prayer}
          blocks={hourBlocks}
          mysteries={[]}
          activeSection={section}
          kicker={section.subtitle ?? undefined}
          prefaceSlot={
            <LiturgyHoursOfficeCards
              office={office}
              isLoading={officeLoading}
              hourTitle={section.title}
              hourLatin={section.subtitle ?? ''}
            />
          }
        />
      </>
    );
  }

  // Seletor
  const sections = hierarchy?.sections ?? [];
  const orderedSections = HOUR_ORDER
    .map((slug) => sections.find((s) => s.slug === slug))
    .filter((s): s is NonNullable<typeof s> => !!s);

  return (
    <>
      <SEOHead
        title="Breviário · Liturgia das Horas — Cathedra"
        description="Reze o Ofício Divino: sete horas canônicas com Ordinário do rito romano e Próprio do dia atualizado pelas leituras da liturgia."
        path="/breviary"
      />
      <div className="w-full space-y-spacing-xl">
        <div className="text-center space-y-spacing-sm">
          <div className="inline-flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs bg-primary/10 rounded-premium">
            <Icons.History className="w-spacing-sm h-spacing-sm text-primary" />
            <span className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">
              Liturgia Horarum
            </span>
          </div>
          <h1 className="text-premium-3xl md:text-premium-5xl font-display font-bold text-foreground">
            Breviário
          </h1>
          <p className="text-muted-foreground font-serif italic leading-relaxed">
            A Liturgia das Horas santifica cada momento do dia pela oração da Igreja.
          </p>
        </div>

        <div className="text-center">
          <p className="text-premium-xs font-black uppercase tracking-[0.25em] text-muted-foreground mb-spacing-sm">
            Hora sugerida agora
          </p>
          <Button
            onClick={() => setSelectedHour(suggested)}
            disabled={!prayer || loading}
            className="px-spacing-lg py-spacing-sm bg-foreground text-background rounded-premium-full font-black uppercase text-premium-xs tracking-widest shadow-premium hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-spacing-xs mx-auto"
          >
            {HOUR_ICON[suggested]}
            Rezar {orderedSections.find((s) => s.slug === suggested)?.title ?? 'agora'}
          </Button>
        </div>

        {loading || !prayer ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-sm">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-premium-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-sm">
            {orderedSections.map((s) => {
              const isSuggested = s.slug === suggested;
              const time = (s.meta as { time?: string } | null)?.time;
              return (
                <Button
                  key={s.id}
                  onClick={() => setSelectedHour(s.slug as HourSlug)}
                  className={`text-left p-spacing-md rounded-premium-full border transition-all group space-y-spacing-2xs ${
                    isSuggested
                      ? 'bg-primary/5 border-primary/30 hover:bg-primary/10'
                      : 'bg-card border-border hover:border-primary/30 hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="opacity-80">{HOUR_ICON[s.slug as HourSlug]}</span>
                    {time && (
                      <span className="text-premium-xs font-black text-primary tracking-widest">
                        {time}
                      </span>
                    )}
                  </div>
                  <h3 className="text-premium-base font-display font-bold text-foreground group-hover:text-primary transition-colors">
                    {s.title}
                  </h3>
                  {s.subtitle && (
                    <p className="text-premium-xs font-serif italic text-muted-foreground">
                      {s.subtitle}
                    </p>
                  )}
                  {isSuggested && (
                    <span className="inline-block font-serif px-spacing-xs py-spacing-3xs rounded text-premium-xs font-black uppercase tracking-wider bg-primary/10 text-primary">
                      Hora atual
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default BreviaryPage;
