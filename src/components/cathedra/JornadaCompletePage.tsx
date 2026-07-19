/**
 * JornadaCompletePage — refino editorial Logos 2030.
 *
 * Preserva integralmente lógica de recompensas (XP/badges), reflexões,
 * próxima jornada e compartilhamento do certificado. Realinha o visual
 * ao padrão stitch-* usado em /jornadas e no leitor de passo.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  ChevronRight,
  Quote,
  Share2,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import { checkNewBadges, getBadgeById, BadgeContext } from '@/lib/badges';

const JornadaCompletePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [journey, setJourney] = useState<any>(null);
  const [reflections, setReflections] = useState<{ title: string; reflection: string; completed_at: string }[]>([]);
  const [nextJourney, setNextJourney] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [rewardsProcessed, setRewardsProcessed] = useState(false);
  const [totalSteps, setTotalSteps] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);
  const certificateRef = useRef<HTMLDivElement>(null);

  const isJourneyComplete = totalSteps > 0 && completedSteps >= totalSteps;
  const hasCertificateData = !!(journey?.title);
  const canShareCertificate = hasCertificateData && isJourneyComplete;

  useEffect(() => {
    if (id && user) loadData();
     
  }, [id, user]);

  useEffect(() => {
    if (!loading && journey) {
      import('canvas-confetti').then((mod) => {
        mod.default({
          particleCount: 180,
          spread: 110,
          origin: { y: 0.4 },
          colors: ['#c9a84c', '#e8c547', '#b8860b', '#0B1F3A'],
        });
      });
    }
  }, [loading, journey]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [journeyRes, progressRes, nextRes, totalRes] = await Promise.all([
        supabase.from('journeys').select('*').eq('id', id!).single(),
        supabase
          .from('journey_progress')
          .select('reflection, completed_at, step_id')
          .eq('user_id', user!.id)
          .eq('journey_id', id!)
          .order('completed_at', { ascending: true }),
        supabase
          .from('journeys')
          .select('*')
          .eq('is_active', true)
          .neq('id', id!)
          .order('sort_order', { ascending: true })
          .limit(3),
        supabase
          .from('journey_steps')
          .select('*', { count: 'exact', head: true })
          .eq('journey_id', id!),
      ]);

      if (journeyRes.data) setJourney(journeyRes.data);
      setTotalSteps(totalRes.count || 0);
      setCompletedSteps(progressRes.data?.length || 0);

      if (progressRes.data) {
        const stepIds = progressRes.data.map((p) => p.step_id);
        const { data: steps } = await supabase
          .from('journey_steps')
          .select('id, title, step_order')
          .in('id', stepIds)
          .order('step_order', { ascending: true });

        const stepMap = new Map(steps?.map((s) => [s.id, s.title]) || []);
        setReflections(
          progressRes.data
            .filter((p) => p.reflection)
            .map((p) => ({
              title: stepMap.get(p.step_id) || 'Etapa',
              reflection: p.reflection!,
              completed_at: p.completed_at,
            })),
        );
      }

      if (nextRes.data && nextRes.data.length > 0) {
        setNextJourney(nextRes.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && journey && user && !rewardsProcessed) {
      processRewards();
    }
     
  }, [loading, journey, user, rewardsProcessed]);

  const processRewards = async () => {
    if (!user) return;
    setRewardsProcessed(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp, badges, streak, completed_books, total_minutes_read')
        .eq('id', user.id)
        .single();
      if (!profile) return;

      const { data: allJourneys } = await supabase.from('journeys').select('id').eq('is_active', true);

      let completedJourneyCount = 0;
      if (allJourneys) {
        for (const j of allJourneys) {
          const { count: totalSteps } = await supabase
            .from('journey_steps')
            .select('*', { count: 'exact', head: true })
            .eq('journey_id', j.id);
          const { count: doneSteps } = await supabase
            .from('journey_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('journey_id', j.id);
          if (totalSteps && doneSteps && doneSteps >= totalSteps) {
            completedJourneyCount++;
          }
        }
      }

      const xpGain = 100;
      const newXp = (profile.xp || 0) + xpGain;
      setXpAwarded(xpGain);

      const ctx: BadgeContext = {
        completedBooks: new Set(profile.completed_books || []),
        chaptersRead: {},
        totalMinutesRead: profile.total_minutes_read || 0,
        streak: profile.streak || 0,
        completedJourneys: completedJourneyCount,
      };

      const earned = checkNewBadges(profile.badges || [], ctx);
      setNewBadges(earned);

      const updatedBadges = [...(profile.badges || []), ...earned];
      await supabase.from('profiles').update({ xp: newXp, badges: updatedBadges }).eq('id', user.id);

      earned.forEach((badgeId) => {
        const badge = getBadgeById(badgeId);
        if (badge) {
          toast.success(`${badge.icon} Nova conquista: ${badge.name}!`, {
            description: badge.description,
            duration: 5000,
          });
        }
      });
    } catch (err) {
      console.error('Rewards error:', err);
    }
  };

  const shareCertificate = async () => {
    if (!certificateRef.current) return;
    if (!canShareCertificate) {
      toast.error(
        !hasCertificateData
          ? 'Dados da jornada indisponíveis.'
          : 'Conclua todas as etapas antes de compartilhar o certificado.',
      );
      return;
    }
    setSharing(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(certificateRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to generate image');

      const file = new File(
        [blob],
        `cathedra-certificado-${journey.title.replace(/\s+/g, '-').toLowerCase()}.png`,
        { type: 'image/png' },
      );

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Certificado: ${journey.title}`,
          text: `Concluí a jornada "${journey.title}" no Cathedra.`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Certificado salvo como imagem.');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        toast.error('Erro ao compartilhar certificado');
      }
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-stitch-background">
        <div className="mx-auto max-w-[900px] px-5 pt-16 md:px-16">
          <div className="h-4 w-32 animate-pulse bg-stitch-surface-container-high" />
          <div className="mt-8 h-[280px] w-full animate-pulse border border-stitch-outline-variant/20 bg-stitch-surface-container-lowest" />
          <div className="mt-8 h-16 w-full animate-pulse bg-stitch-surface-container-high" />
        </div>
      </div>
    );
  }

  if (!journey) return null;

  const completionDate = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      className="min-h-screen w-full bg-stitch-background text-stitch-on-background"
      style={{
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/p6.png")',
      }}
    >
      <Helmet>
        <title>Jornada concluída — {journey.title} — Cathedra</title>
      </Helmet>

      <main className="mx-auto w-full max-w-[900px] px-5 pb-24 pt-8 md:px-16 md:pt-12 animate-fade-in">
        {/* Breadcrumb */}
        <Link
          to={AppRoute.JORNADAS}
          className="inline-flex items-center gap-2 font-stitch-body text-[12px] font-bold uppercase tracking-[0.2em] text-stitch-on-surface-variant transition-colors hover:text-stitch-secondary"
        >
          <ArrowLeft className="h-3 w-3" /> Formação
        </Link>

        {/* Kicker de conclusão */}
        <div className="mt-6 flex items-center gap-2 font-stitch-body text-[12px] font-bold uppercase tracking-[0.32em] text-stitch-secondary">
          <Sparkles className="h-3 w-3" /> Jornada Concluída
        </div>
        <h1 className="mt-2 font-stitch-display text-[32px] italic leading-[40px] text-stitch-primary md:text-[48px] md:leading-[58px] md:tracking-[-0.02em]">
          Deo gratias.
        </h1>
        <p className="mt-3 max-w-[62ch] font-stitch-body text-[16px] leading-[28px] text-stitch-on-surface-variant md:text-[18px] md:leading-[30px]">
          Você percorreu <span className="italic text-stitch-primary">{journey.title}</span>. Que o
          que foi lido se torne oração, e o que foi orado se torne vida.
        </p>

        {/* ─── Barra de progresso final ─────────────── */}
        <div className="mt-8 max-w-[520px]" role="group" aria-label="Progresso da jornada">
          <div className="flex items-baseline justify-between font-stitch-body text-[11px] font-bold uppercase tracking-[0.24em] text-stitch-on-surface-variant">
            <span>Progresso</span>
            <span className="text-stitch-secondary">100% · Completa</span>
          </div>
          <div
            className="mt-2 h-[2px] w-full overflow-hidden bg-stitch-surface-container-high"
            role="progressbar"
            aria-valuenow={100}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="h-full bg-stitch-secondary"
            />
          </div>
        </div>

        {/* ─── Certificado ───────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-10"
        >
          <div ref={certificateRef}>
            <div
              className="relative overflow-hidden border border-stitch-secondary/30 bg-stitch-surface-container-lowest p-8 text-center md:p-12"
              style={{
                backgroundImage:
                  'url("https://www.transparenttextures.com/patterns/parchment.png")',
              }}
            >
              <div className="pointer-events-none absolute inset-3 border border-stitch-secondary/20" />
              <div className="relative">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-stitch-secondary/40 bg-stitch-secondary/10">
                  <Award className="h-7 w-7 text-stitch-secondary" />
                </div>
                <p className="mt-6 font-stitch-body text-[11px] font-bold uppercase tracking-[0.32em] text-stitch-secondary">
                  Certificado de Conclusão
                </p>
                <h2 className="mt-3 font-stitch-display text-[26px] italic leading-[34px] text-stitch-primary md:text-[36px] md:leading-[44px]">
                  {journey.title}
                </h2>
                {journey.subtitle && (
                  <p className="mt-2 font-stitch-body text-[14px] italic text-stitch-on-surface-variant md:text-[15px]">
                    {journey.subtitle}
                  </p>
                )}
                <div className="mx-auto mt-8 max-w-xs border-t border-b border-stitch-secondary/20 py-4">
                  <p className="font-stitch-body text-[10px] font-bold uppercase tracking-[0.28em] text-stitch-on-surface-variant">
                    Concluída em
                  </p>
                  <p className="mt-1 font-stitch-display text-[16px] italic text-stitch-primary">
                    {completionDate}
                  </p>
                </div>
                <p className="mt-6 font-stitch-body text-[10px] font-bold uppercase tracking-[0.4em] text-stitch-secondary">
                  Cathedra · Digital Sanctuarium
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <button
              onClick={shareCertificate}
              disabled={sharing}
              className="inline-flex items-center gap-2 border border-stitch-outline-variant/40 px-5 py-2.5 font-stitch-body text-[12px] font-bold uppercase tracking-[0.2em] text-stitch-primary transition-colors hover:border-stitch-secondary hover:text-stitch-secondary disabled:opacity-50"
            >
              {sharing ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
              {sharing ? 'Gerando imagem…' : 'Compartilhar Certificado'}
            </button>
          </div>
        </motion.section>

        {/* ─── Recompensas ───────────────────────────── */}
        {(xpAwarded > 0 || newBadges.length > 0) && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-14"
          >
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="flex items-center gap-2 font-stitch-display text-[22px] italic text-stitch-primary md:text-[26px]">
                <Star className="h-4 w-4 text-stitch-secondary" /> Recompensas
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {xpAwarded > 0 && (
                <div className="flex items-center gap-4 border border-stitch-outline-variant/25 bg-stitch-surface-container-lowest p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stitch-secondary/15 text-stitch-secondary">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-stitch-display text-[20px] italic leading-none text-stitch-primary">
                      +{xpAwarded} XP
                    </p>
                    <p className="mt-1 font-stitch-body text-[12px] text-stitch-on-surface-variant">
                      Por concluir esta jornada
                    </p>
                  </div>
                </div>
              )}
              {newBadges.map((badgeId) => {
                const badge = getBadgeById(badgeId);
                if (!badge) return null;
                return (
                  <div
                    key={badgeId}
                    className="flex items-center gap-4 border border-stitch-outline-variant/25 bg-stitch-surface-container-lowest p-4"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stitch-secondary/10 text-[22px]">
                      {badge.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-stitch-display text-[17px] italic text-stitch-primary">
                        {badge.name}
                      </p>
                      <p className="mt-0.5 font-stitch-body text-[12px] leading-snug text-stitch-on-surface-variant">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* ─── Reflexões ─────────────────────────────── */}
        {reflections.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-14"
          >
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="flex items-center gap-2 font-stitch-display text-[22px] italic text-stitch-primary md:text-[26px]">
                <BookOpen className="h-4 w-4 text-stitch-secondary" /> Suas Reflexões
              </h2>
              <span className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-on-surface-variant">
                {reflections.length} registro{reflections.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="space-y-3">
              {reflections.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                  className="border border-stitch-outline-variant/25 bg-stitch-surface-container-lowest p-5"
                >
                  <p className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.22em] text-stitch-secondary">
                    {r.title}
                  </p>
                  <div className="mt-3 flex gap-3">
                    <Quote className="h-4 w-4 flex-shrink-0 text-stitch-secondary/60" />
                    <p className="font-stitch-body text-[15px] italic leading-[26px] text-stitch-on-surface md:text-[16px] md:leading-[28px]">
                      {r.reflection}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ─── Próxima jornada ───────────────────────── */}
        {nextJourney && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="mt-14"
          >
            <h2 className="mb-4 font-stitch-display text-[22px] italic text-stitch-primary md:text-[26px]">
              Continue sua caminhada
            </h2>
            <Link
              to={`/jornadas/${nextJourney.id}`}
              className="group relative flex items-center gap-5 border border-stitch-outline-variant/25 bg-stitch-surface-container-lowest p-6 transition-all hover:border-stitch-secondary/50 hover:shadow-sm"
            >
              <div className="absolute left-0 top-0 h-full w-1 origin-top scale-y-0 bg-stitch-secondary transition-transform group-hover:scale-y-100" />
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-stitch-secondary/10 text-stitch-secondary">
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-secondary">
                  Próxima Jornada
                </p>
                <h3 className="mt-1 font-stitch-display text-[20px] italic text-stitch-primary md:text-[22px]">
                  {nextJourney.title}
                </h3>
                {nextJourney.subtitle && (
                  <p className="mt-1 line-clamp-2 font-stitch-body text-[13px] text-stitch-on-surface-variant">
                    {nextJourney.subtitle}
                  </p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-stitch-on-surface-variant transition-colors group-hover:text-stitch-secondary" />
            </Link>
          </motion.section>
        )}

        {/* ─── Ações ─────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="mt-14 flex flex-col gap-2 sm:flex-row"
        >
          <button
            onClick={() => navigate(AppRoute.JORNADAS)}
            className="inline-flex flex-1 items-center justify-center gap-2 bg-stitch-primary px-5 py-3 font-stitch-body text-[12px] font-bold uppercase tracking-[0.22em] text-stitch-primary-foreground transition-colors hover:bg-stitch-primary/90"
          >
            Ver todas as jornadas <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => navigate(`/jornadas/${id}`)}
            className="inline-flex flex-1 items-center justify-center gap-2 border border-stitch-outline-variant/40 px-5 py-3 font-stitch-body text-[12px] font-bold uppercase tracking-[0.22em] text-stitch-primary transition-colors hover:border-stitch-secondary hover:text-stitch-secondary"
          >
            Rever etapas
          </button>
        </motion.section>

        <p className="mt-16 border-t border-stitch-secondary/10 pt-6 text-center font-stitch-body text-[13px] italic text-stitch-on-surface-variant">
          "Combati o bom combate, terminei a corrida, guardei a fé." — 2Tm 4,7
        </p>
      </main>
    </div>
  );
};

export default JornadaCompletePage;
