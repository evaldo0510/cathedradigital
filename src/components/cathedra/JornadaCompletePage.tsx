import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, ArrowRight, BookOpen, Quote, ChevronRight, Sparkles, ArrowLeft, Share2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import { toast } from 'sonner';
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
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && user) loadData();
  }, [id, user]);

  useEffect(() => {
    if (!loading && journey) {
      import('canvas-confetti').then(mod => {
        mod.default({ particleCount: 200, spread: 120, origin: { y: 0.5 }, colors: ['#d4af37', '#e8c547', '#b8860b', '#8B5CF6', '#4ECDC4'] });
      });
    }
  }, [loading, journey]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [journeyRes, progressRes, nextRes] = await Promise.all([
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
      ]);

      if (journeyRes.data) setJourney(journeyRes.data);

      if (progressRes.data) {
        // Get step titles
        const stepIds = progressRes.data.map(p => p.step_id);
        const { data: steps } = await supabase
          .from('journey_steps')
          .select('id, title, step_order')
          .in('id', stepIds)
          .order('step_order', { ascending: true });

        const stepMap = new Map(steps?.map(s => [s.id, s.title]) || []);
        setReflections(
          progressRes.data
            .filter(p => p.reflection)
            .map(p => ({
              title: stepMap.get(p.step_id) || 'Etapa',
              reflection: p.reflection!,
              completed_at: p.completed_at,
            }))
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

  // Award XP and badges on first visit to completion page
  useEffect(() => {
    if (!loading && journey && user && !rewardsProcessed) {
      processRewards();
    }
  }, [loading, journey, user, rewardsProcessed]);

  const processRewards = async () => {
    if (!user) return;
    setRewardsProcessed(true);
    try {
      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp, badges, streak, completed_books, total_minutes_read')
        .eq('id', user.id)
        .single();
      if (!profile) return;

      // Count completed journeys (distinct journey_ids where all steps done)
      const { data: allJourneys } = await supabase
        .from('journeys')
        .select('id')
        .eq('is_active', true);

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

      // Award XP: 100 per journey completion
      const xpGain = 100;
      const newXp = (profile.xp || 0) + xpGain;
      setXpAwarded(xpGain);

      // Check badges
      const ctx: BadgeContext = {
        completedBooks: new Set(profile.completed_books || []),
        chaptersRead: {},
        totalMinutesRead: profile.total_minutes_read || 0,
        streak: profile.streak || 0,
        completedJourneys: completedJourneyCount,
      };

      const earned = checkNewBadges(profile.badges || [], ctx);
      setNewBadges(earned);

      // Update profile
      const updatedBadges = [...(profile.badges || []), ...earned];
      await supabase
        .from('profiles')
        .update({ xp: newXp, badges: updatedBadges })
        .eq('id', user.id);

      // Show toast for badges
      earned.forEach(badgeId => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-spacing-xl h-spacing-xl border-2 border-secondary border-t-transparent rounded-premium animate-spin" />
      </div>
    );
  }

  if (!journey) return null;

  const completionDate = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const shareCertificate = async () => {
    if (!certificateRef.current) return;
    setSharing(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(certificateRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to generate image');

      const file = new File([blob], `cathedra-certificado-${journey.title.replace(/\s+/g, '-').toLowerCase()}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Certificado: ${journey.title}`,
          text: `Concluí a jornada "${journey.title}" no Cathedra! 🏅`,
          files: [file],
        });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Certificado salvo como imagem!');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        toast.error('Erro ao compartilhar certificado');
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="space-y-spacing-xl max-w-spacing-2xl mx-auto pb-spacing-2xl">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate(AppRoute.JORNADAS)}>
        <ArrowLeft className="w-spacing-md h-spacing-md mr-spacing-xs" /> Jornadas
      </Button>

      {/* Certificate */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div ref={certificateRef}>
          <Card className="border-primary/30 bg-gradient-to-b from-primary/5 to-background overflow-hidden">
            <CardContent className="p-spacing-xl text-center space-y-spacing-lg">
              <div className="w-spacing-3xl h-spacing-3xl mx-auto rounded-premium bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                <Award className="w-spacing-xl h-spacing-xl text-primary" />
              </div>

              <div className="space-y-spacing-xs">
                <p className="text-premium-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Certificado de Conclusão</p>
                <h1 className="text-premium-2xl md:text-premium-3xl font-bold font-serif text-foreground">{journey.title}</h1>
                <p className="text-premium-sm text-muted-foreground italic">{journey.subtitle}</p>
              </div>

              <div className="border-t border-b border-border/50 py-spacing-md space-y-spacing-2xs">
                <p className="text-premium-xs text-muted-foreground">Jornada concluída em</p>
                <p className="text-premium-sm font-semibold text-foreground">{completionDate}</p>
              </div>

              <div className="flex items-center justify-center gap-spacing-xs text-premium-xs text-muted-foreground">
                <Sparkles className="w-spacing-sm h-spacing-sm text-primary" />
                <span>CATHEDRA — Digital Sanctuarium</span>
                <Sparkles className="w-spacing-sm h-spacing-sm text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Share Button */}
        <div className="flex justify-center mt-spacing-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={shareCertificate}
            disabled={sharing}
            className="flex items-center gap-spacing-xs"
          >
            <Share2 className="w-spacing-md h-spacing-md" />
            {sharing ? 'Gerando imagem...' : 'Compartilhar Certificado'}
          </Button>
        </div>
      </motion.div>

      {/* XP & Badges Reward */}
      {(xpAwarded > 0 || newBadges.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="p-spacing-lg space-y-spacing-md">
              <h2 className="text-premium-lg font-bold text-foreground flex items-center gap-spacing-xs">
                <Star className="w-spacing-md h-spacing-md text-primary" /> Recompensas
              </h2>
              {xpAwarded > 0 && (
                <div className="flex items-center gap-spacing-sm p-spacing-sm bg-primary/10 rounded-premium">
                  <div className="w-spacing-xl h-spacing-xl rounded-premium bg-primary/20 flex items-center justify-center text-premium-lg">⚡</div>
                  <div>
                    <p className="text-premium-sm font-bold text-foreground">+{xpAwarded} XP</p>
                    <p className="text-premium-xs text-muted-foreground">Por concluir esta jornada</p>
                  </div>
                </div>
              )}
              {newBadges.map(badgeId => {
                const badge = getBadgeById(badgeId);
                if (!badge) return null;
                return (
                  <div key={badgeId} className="flex items-center gap-spacing-sm p-spacing-sm bg-accent/10 rounded-premium">
                    <div className="w-spacing-xl h-spacing-xl rounded-premium bg-accent/20 flex items-center justify-center text-premium-lg">{badge.icon}</div>
                    <div>
                      <p className="text-premium-sm font-bold text-foreground">{badge.name}</p>
                      <p className="text-premium-xs text-muted-foreground">{badge.description}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Reflections Summary */}
      {reflections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-spacing-md"
        >
          <h2 className="text-premium-lg font-bold text-foreground flex items-center gap-spacing-xs">
            <BookOpen className="w-spacing-md h-spacing-md text-primary" /> Suas Reflexões
          </h2>

          <div className="space-y-spacing-sm">
            {reflections.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <Card className="border-border/50">
                  <CardContent className="p-spacing-md space-y-spacing-xs">
                    <p className="text-premium-xs font-bold uppercase tracking-wider text-primary">{r.title}</p>
                    <div className="flex gap-spacing-xs">
                      <Quote className="w-spacing-md h-spacing-md text-muted-foreground flex-shrink-0 mt-spacing-3xs" />
                      <p className="text-premium-sm text-foreground/80 italic font-serif leading-relaxed">{r.reflection}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Next Journey Suggestion */}
      {nextJourney && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-spacing-sm"
        >
          <h2 className="text-premium-lg font-bold text-foreground">Continue sua caminhada</h2>

          <Card
            className="border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
            onClick={() => navigate(`/jornadas/${nextJourney.id}`)}
          >
            <CardContent className="p-spacing-md flex items-center gap-spacing-md">
              <div className="w-spacing-2xl h-spacing-2xl rounded-premium bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-spacing-lg h-spacing-lg text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-premium-sm text-foreground">{nextJourney.title}</h3>
                {nextJourney.subtitle && (
                  <p className="text-premium-xs text-muted-foreground truncate">{nextJourney.subtitle}</p>
                )}
              </div>
              <ChevronRight className="w-spacing-md h-spacing-md text-muted-foreground" />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="flex flex-col sm:flex-row gap-spacing-sm"
      >
        <Button
          className="flex-1"
          onClick={() => navigate(AppRoute.JORNADAS)}
        >
          Ver Todas as Jornadas
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => navigate(`/jornadas/${id}`)}
        >
          Rever Etapas
        </Button>
      </motion.div>
    </div>
  );
};

export default JornadaCompletePage;
