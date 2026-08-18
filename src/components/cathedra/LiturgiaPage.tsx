import React, { useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import { useDailyLiturgy } from '@/hooks/useDailyLiturgy';
import { useChurchContext } from '@/hooks/useChurchContext';
import { toIsoDateKey } from '@/core/liturgy/LiturgyProvider';

import { LiturgiaSkeleton } from './LiturgiaSkeleton';
import SacredImage from './SacredImage';
import { getTabProps, getTabPanelProps, useTabNavigation } from './TabUtils';
import {
  ReaderShell,
  EditorialHero,
  LiturgicalContext,
  NexusPanel,
  ReaderContinuation,
} from '@/components/reader';
import {
  LiturgyDateNav,
  LiturgyDayHeader,
  LiturgyPsalmCard,
  LiturgyReadingCard,
  LiturgyThemeCard,
  LiturgyReadingKeyCard,
  LiturgyTraditionCard,
  LiturgyLogosCard,
  LiturgyFinalPrayerCard,
  LiturgyChurchHistoryCard,
  LiturgyActionCard,
  LiturgyMeditationSkeleton,
  LiturgyMeditationFallbackNotice,
} from './primitives/liturgy';
import { useLiturgyMeditation } from '@/hooks/useLiturgyMeditation';
import { resolveLiturgyAutoNexus } from '@/core/knowledge/adapters/liturgyAutoNexus';

const MissalPage = lazy(() => import('./MissalPage'));
const LiturgicalCalendarPage = lazy(() => import('./LiturgicalCalendarPage'));

function parseRefToRoute(ref: string): string {
  const match = ref.match(/^(\d?\s?[A-Za-zÀ-ú]+)\s+(\d+)/);
  if (!match) return AppRoute.BIBLE;
  const book = match[1].trim();
  const chapter = match[2];
  return `${AppRoute.BIBLE}?book=${encodeURIComponent(book)}&chapter=${chapter}`;
}

function parseDateParam(raw: string | null): Date {
  if (!raw) return new Date();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return new Date();
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return new Date();
  return d;
}

const LiturgiaPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { handleKeyDown: handleTabKeyDown } = useTabNavigation();
  const activeTab = searchParams.get('tab') || 'liturgia';
  const tabList = ['liturgia', 'missal', 'calendario'];

  const { profile } = useAuth();

  // Data controlada por `?d=YYYY-MM-DD` (deep link + navegação nativa).
  const selectedDate = useMemo(
    () => parseDateParam(searchParams.get('d')),
    [searchParams],
  );
  const todayIso = toIsoDateKey(new Date());
  const selectedIso = toIsoDateKey(selectedDate);
  const isToday = selectedIso === todayIso;

  const setSelectedDate = useCallback(
    (d: Date) => {
      const next = new URLSearchParams(searchParams);
      const iso = toIsoDateKey(d);
      if (iso === todayIso) next.delete('d');
      else next.set('d', iso);
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams, todayIso],
  );

  // Kernel eclesial (SSoT) — santo, calendário e liturgia vêm daqui.
  const church = useChurchContext(selectedDate);
  const saint = church.todaySaint;
  const { liturgy: readings, isLoading, isOfflineData } = useDailyLiturgy(selectedDate);

  const { meditation, isLoading: isMeditationLoading, isFetching: isMeditationFetching, retry: retryMeditation } = useLiturgyMeditation(
    selectedIso,
    readings ?? null,
  );

  const nexus = useMemo(() => {
    if (!readings?.evangelho) return null;
    return resolveLiturgyAutoNexus({
      ref: readings.evangelho.referencia,
      title: readings.liturgia ?? readings.dia ?? readings.evangelho.referencia,
      season: readings.season ?? null,
    });
  }, [readings]);

  const { data: prayerOfDay } = useQuery({
    queryKey: ['prayer-of-day', selectedIso],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prayers')
        .select('slug, title, subtitle, kicker, category, estimated_seconds')
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return null;
      const startOfYear = new Date(selectedDate.getFullYear(), 0, 0).getTime();
      const dayOfYear = Math.floor((selectedDate.getTime() - startOfYear) / 86400000);
      return data[dayOfYear % data.length];
    },
    staleTime: 1000 * 60 * 60,
  });

  const navigateToLectio = (ref?: string) => {
    const q = ref ? `?ref=${encodeURIComponent(ref)}` : '';
    navigate(`${AppRoute.LECTIO_DIVINA}${q}`);
  };

  const formattedDate = selectedDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const liturgyHero = readings ? (
    <EditorialHero
      kicker="Liturgia"
      title={readings.liturgia || readings.dia || 'Liturgia do Dia'}
      subtitle={formattedDate}
      align="center"
      size="md"
    />
  ) : null;

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen">
      {/* Desktop Sidebar: Liturgical Sacred Image */}
      <div className="hidden md:flex md:w-[40%] sticky top-0 h-screen overflow-hidden bg-primary/5 border-r border-primary/5">
        <SacredImage 
          src={undefined} // Will use default sacred visuals if none provided
          className="w-full h-full object-cover opacity-60 mix-blend-multiply" 
          alt={readings?.liturgia || "Liturgia"} 
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background via-transparent to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-spacing-xl text-center space-y-spacing-lg">
           <div className="w-spacing-4xl h-spacing-4xl mx-auto rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-premium">
             <Icons.Liturgy className="w-spacing-xl h-spacing-xl text-secondary" />
           </div>
           <div className="space-y-spacing-xs">
             <h2 className="font-display text-4xl text-primary/40 tracking-widest uppercase italic">Liturgia</h2>
             <p className="text-[10px] uppercase tracking-[0.4em] text-secondary/60 font-bold">Verbum Domini</p>
           </div>
           
           {readings?.colorToken && (
             <div className="flex items-center gap-spacing-xs px-spacing-md py-spacing-2xs rounded-full border border-primary/10 bg-background/50 backdrop-blur-sm">
                <div className={cn("w-3 h-3 rounded-full shadow-sm", String(readings.colorToken) === 'green' ? 'bg-green-600' : String(readings.colorToken) === 'red' ? 'bg-red-600' : String(readings.colorToken) === 'white' ? 'bg-stone-200' : String(readings.colorToken) === 'violet' ? 'bg-violet-700' : 'bg-secondary')} />
                <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">{readings.cor || readings.colorToken}</span>
             </div>
           )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
      <SEOHead title="Liturgia do Dia" description="Leituras do dia." path="/liturgia" keywords="liturgia" />
      
      {/* Header Fixo com Abas */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/40 py-spacing-sm px-spacing-md flex justify-center">
        <div className="bg-muted/40 p-spacing-2xs rounded-[2.5rem] border border-border/40 flex gap-spacing-2xs w-full max-w-lg shadow-premium-md" role="tablist" aria-label="Navegação da Liturgia">
          {[
            { id: 'liturgia', label: 'Liturgia', icon: <Icons.Liturgy className="w-spacing-md h-spacing-md" /> },
            { id: 'missal', label: 'Missal', icon: <Icons.Cross className="w-spacing-md h-spacing-md" /> },
            { id: 'calendario', label: 'Calendário', icon: <Icons.Calendar className="w-spacing-md h-spacing-md" /> }
          ].map((tab, idx) => (
            <Button
              key={tab.id}
              variant="ghost"
              {...getTabProps(`tab-${tab.id}`, `panel-${tab.id}`, activeTab === tab.id, `flex-1 flex items-center justify-center gap-spacing-2xs px-spacing-xs py-spacing-sm rounded-premium-full text-[10px] sm:text-premium-sm font-black uppercase tracking-wider transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none min-w-0 ${
                activeTab === tab.id ? 'bg-background shadow-premium-hover text-primary hover:bg-background' : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`)}
              onClick={() => setSearchParams({ tab: tab.id })}
              onKeyDown={(e) => handleTabKeyDown(e, idx, 3, (newIdx) => setSearchParams({ tab: tabList[newIdx] }), 'tab-')}
            >
              {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="w-full">
        <Suspense fallback={<div className="flex justify-center py-spacing-3xl"><Icons.Loader2 className="w-spacing-xl h-spacing-xl text-secondary animate-spin" /></div>}>
          {activeTab === 'liturgia' && (
            <ReaderShell
              hero={liturgyHero}
              headerContext={readings ? (
                <LiturgicalContext
                  date={formattedDate}
                  color={readings.colorToken}
                  season={readings.season ?? undefined}
                />
              ) : undefined}
              nexus={nexus ? <NexusPanel output={nexus} kicker={`Conexões de ${formattedDate}`} /> : undefined}
              continuation={readings && readings.evangelho ? (
                <div className="mt-spacing-xl">
                  <ReaderContinuation
                    context={{
                      kind: 'bible',
                      id: readings.evangelho.referencia,
                      graphNodeId: nexus?.selfId ?? undefined,
                    }}
                    suggestions={nexus?.suggestions.length && nexus.suggestions.length > 0 ? nexus.suggestions : undefined}
                  />
                </div>
              ) : undefined}
              ariaLabel="Liturgia do Dia"
              contentMaxWidth="max-w-4xl"
            >
              <div {...getTabPanelProps('panel-liturgia', 'tab-liturgia', activeTab === 'liturgia', "w-full space-y-spacing-xl animate-in fade-in duration-500 outline-none")}>
                <div className="space-y-spacing-md">
                  <LiturgyDateNav
                    date={selectedDate}
                    onChange={setSelectedDate}
                    isToday={isToday}
                  />
                  {isOfflineData && (
                    <div className="flex items-center justify-center gap-spacing-xs text-premium-xs font-black uppercase tracking-widest text-muted-foreground bg-muted/50 rounded-premium px-spacing-md py-spacing-xs mx-auto w-fit">
                      <Icons.WifiOff className="w-spacing-sm h-spacing-sm" /> <span>Modo Offline</span>
                    </div>
                  )}
                </div>

                {profile?.diocese && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-secondary/5 border border-secondary/20 rounded-premium p-spacing-md flex items-center justify-between group">
                    <div className="flex items-center gap-spacing-sm">
                      <div className="p-spacing-xs rounded-premium bg-secondary/10 text-secondary"><Icons.Church className="w-spacing-md h-spacing-md" /></div>
                      <div><p className="text-premium-xs font-black uppercase tracking-widest text-secondary/60">Sua Diocese</p><h3 className="text-premium-sm font-bold text-primary">{profile.diocese}</h3></div>
                    </div>
                    <div className="text-right"><p className="text-premium-xs font-medium text-muted-foreground uppercase tracking-widest">Estado</p><p className="text-premium-xs font-bold text-primary">{profile.estado}</p></div>
                  </motion.div>
                )}

                {isLoading && <LiturgiaSkeleton />}
                {readings && (
                  <div className="space-y-spacing-xl">
                    {readings.primeiraLeitura && (
                      <LiturgyReadingCard
                        kind="first"
                        reference={readings.primeiraLeitura.referencia}
                        text={readings.primeiraLeitura.texto}
                        onOpenBible={() => navigate(parseRefToRoute(readings.primeiraLeitura!.referencia))}
                        onOpenLectio={() => navigateToLectio(readings.primeiraLeitura!.referencia)}
                        delay={0.1}
                      />
                    )}
                    {readings.salmo && (
                      <LiturgyPsalmCard
                        reference={readings.salmo.referencia}
                        refrain={readings.salmo.refrao}
                        text={readings.salmo.texto}
                        onOpenBible={() => navigate(AppRoute.BIBLE)}
                        onOpenLectio={() => navigateToLectio(readings.salmo!.referencia)}
                        delay={0.2}
                      />
                    )}
                    {readings.segundaLeitura && (
                      <LiturgyReadingCard
                        kind="second"
                        reference={readings.segundaLeitura.referencia}
                        text={readings.segundaLeitura.texto}
                        onOpenBible={() => navigate(parseRefToRoute(readings.segundaLeitura!.referencia))}
                        onOpenLectio={() => navigateToLectio(readings.segundaLeitura!.referencia)}
                        delay={0.3}
                      />
                    )}
                    {readings.evangelho && (
                      <LiturgyReadingCard
                        kind="gospel"
                        reference={readings.evangelho.referencia}
                        text={readings.evangelho.texto}
                        onOpenBible={() => navigate(parseRefToRoute(readings.evangelho!.referencia))}
                        onOpenLectio={() => navigateToLectio(readings.evangelho!.referencia)}
                        delay={0.4}
                      />
                    )}
                  </div>
                )}

                {/* ── Centro de Meditação Litúrgica ─────────────── */}
                {isMeditationLoading && !meditation && <LiturgyMeditationSkeleton />}
                {meditation && (
                  <div className="space-y-spacing-xl">
                    {meditation.fallback && (
                      <LiturgyMeditationFallbackNotice
                        message={meditation.fallback_message}
                        code={meditation.fallback_code}
                        source={meditation.fallback_source}
                        retryAt={meditation.fallback_retry_at}
                        onRetry={retryMeditation}
                        isRetrying={isMeditationFetching}
                      />
                    )}
                    {meditation.theme && <LiturgyThemeCard theme={meditation.theme} />}
                    {meditation.reading_key && (
                      <LiturgyReadingKeyCard text={meditation.reading_key} />
                    )}
                    <LiturgyTraditionCard
                      fathers={meditation.fathers ?? []}
                      catechism={meditation.catechism ?? []}
                      magisterium={meditation.magisterium ?? []}
                    />
                    {meditation.logos && <LiturgyLogosCard logos={meditation.logos} />}
                    {meditation.final_prayer && (
                      <LiturgyFinalPrayerCard text={meditation.final_prayer} />
                    )}
                    {meditation.church_history && (
                      <LiturgyChurchHistoryCard history={meditation.church_history} />
                    )}
                    {meditation.action_of_day && (
                      <LiturgyActionCard text={meditation.action_of_day} />
                    )}
                  </div>
                )}

                {saint && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="bg-muted/30 border border-border rounded-[2rem] p-spacing-xl flex flex-col items-center text-center space-y-spacing-md">
                    <div className="w-spacing-3xl h-spacing-3xl rounded-premium-full overflow-hidden border-2 border-secondary p-spacing-2xs shadow-premium shadow-secondary/10">
                      <SacredImage src={saint.image} alt={saint.name} category={(saint as any).category} className="w-full h-full object-cover rounded-premium-full" />
                    </div>
                    <div className="space-y-spacing-2xs">
                      <p className="text-premium-xs font-black uppercase tracking-[0.3em] text-secondary">Santo do Dia</p>
                      <h3 className="text-premium-xl font-display font-black text-primary">{saint.name}</h3>
                      {saint.title && <p className="text-premium-sm font-serif italic text-muted-foreground">{saint.title}</p>}
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-primary/5 h-spacing-xl" onClick={() => navigate(saint.slug ? `${AppRoute.SAINTS}/${saint.slug}` : AppRoute.SAINTS)}>
                      Conhecer História <Icons.ChevronRight className="w-spacing-md h-spacing-md ml-spacing-xs" />
                    </Button>
                  </motion.div>
                )}

                {prayerOfDay && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="premium-card p-spacing-xl space-y-spacing-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-spacing-xl opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none"><Icons.Church className="w-spacing-3xl h-spacing-3xl" /></div>
                    <div className="flex items-center gap-spacing-sm relative z-10">
                      <div className="p-spacing-xs rounded-premium bg-secondary/10 text-secondary"><Icons.Church className="w-spacing-md h-spacing-md" /></div>
                      <div>
                        <p className="text-premium-xs font-black uppercase tracking-[0.3em] text-secondary/70">Oração do Dia</p>
                        {prayerOfDay.kicker && <p className="text-premium-xs font-medium text-muted-foreground mt-spacing-3xs">{prayerOfDay.kicker}</p>}
                      </div>
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-premium-xl md:text-premium-2xl font-display font-black text-primary">{prayerOfDay.title}</h3>
                      {prayerOfDay.subtitle && <p className="text-premium-sm font-serif italic text-muted-foreground mt-spacing-2xs">{prayerOfDay.subtitle}</p>}
                    </div>
                    <div className="flex items-center justify-between pt-spacing-md border-t border-border/40 relative z-10">
                      {prayerOfDay.estimated_seconds ? (
                        <span className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-spacing-2xs"><Icons.Clock className="w-spacing-sm h-spacing-sm" /> {Math.max(1, Math.round(prayerOfDay.estimated_seconds / 60))} min</span>
                      ) : <span />}
                      <Button variant="secondary" size="sm" className="rounded-premium-full h-spacing-xl px-spacing-xl bg-secondary/10 border-none hover:bg-secondary/20 text-primary shadow-premium-md" onClick={() => navigate(`/oracao/${prayerOfDay.slug}?from=liturgia`)}>
                        Rezar agora <Icons.ChevronRight className="w-spacing-md h-spacing-md ml-spacing-xs" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </ReaderShell>
          )}
          {activeTab === 'missal' && <div id="panel-missal" role="tabpanel" aria-labelledby="tab-missal" className="animate-in fade-in slide-in-from-bottom-spacing-md duration-500 outline-none pt-spacing-xl max-w-5xl mx-auto" tabIndex={0}><MissalPage /></div>}
          {activeTab === 'calendario' && <div id="panel-calendario" role="tabpanel" aria-labelledby="tab-calendario" className="animate-in fade-in slide-in-from-bottom-spacing-md duration-500 outline-none pt-spacing-xl max-w-5xl mx-auto" tabIndex={0}><LiturgicalCalendarPage /></div>}
        </Suspense>
      </div>
      </div>
    </div>
  );
};

export default LiturgiaPage;
