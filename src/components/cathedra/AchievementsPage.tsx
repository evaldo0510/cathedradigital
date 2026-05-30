import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BADGE_DEFINITIONS } from '@/lib/badges';
import { Progress } from '@/components/ui/progress';
import { Trophy, Lock, Star, Award, Shield, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const AchievementsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [dbAchievements, setDbAchievements] = useState<any[]>([]);
  const [earnedAchievementIds, setEarnedAchievementIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const earnedBadgesLegacy = useMemo(() => new Set(profile?.badges || []), [profile?.badges]);

  useEffect(() => {
    if (user) loadAchievements();
  }, [user]);

  const loadAchievements = async () => {
    setLoading(true);
    const [achRes, userAchRes] = await Promise.all([
      supabase.from('achievements').select('*'),
      supabase.from('user_achievements').select('achievement_id').eq('user_id', user!.id)
    ]);

    if (achRes.data) setDbAchievements(achRes.data);
    if (userAchRes.data) {
      setEarnedAchievementIds(new Set(userAchRes.data.map(a => a.achievement_id)));
    }
    setLoading(false);
  };

  const totalPossible = BADGE_DEFINITIONS.length + dbAchievements.length;
  const totalEarned = Array.from(earnedBadgesLegacy).length + earnedAchievementIds.size;
  const progress = Math.round((totalEarned / totalPossible) * 100);

  return (
    <div className="max-w-spacing-4xl mx-auto space-y-spacing-2xl py-spacing-2xl md:py-spacing-4xl px-spacing-lg">
      {/* Header */}
      <div className="text-center space-y-spacing-lg">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-spacing-sm px-spacing-md py-spacing-xs bg-primary/5 rounded-premium-full border border-primary/10"
        >
          <Trophy className="w-spacing-md h-spacing-md text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Sacra Victoria</span>
        </motion.div>
        <h1 className="text-premium-4xl md:text-6xl font-display font-bold text-foreground tracking-tight">Suas Conquistas</h1>
        <p className="text-muted-foreground font-serif italic text-premium-lg max-w-spacing-2xl mx-auto">
          "Combati o bom combate, terminei a corrida, guardei a fé." — 2 Timóteo 4,7
        </p>
      </div>

      {/* Summary Card */}
      <Card className="premium-card bg-primary/[0.02] border-primary/5 rounded-[2.5rem] p-spacing-xl md:p-spacing-2xl shadow-premium-none overflow-hidden relative">
        <div className="absolute top-spacing-0 right-0 p-spacing-2xl opacity-[0.03]">
          <Sparkles className="w-spacing-4xl h-spacing-4xl text-primary" />
        </div>
        <div className="relative z-10 space-y-spacing-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-spacing-2xs">
              <h3 className="text-premium-2xl font-bold font-serif">Seu Galardão</h3>
              <p className="text-premium-sm text-muted-foreground/60">Você conquistou {totalEarned} de {totalPossible} marcos espirituais.</p>
            </div>
            <div className="text-premium-4xl font-display font-bold text-primary">{progress}%</div>
          </div>
          <Progress value={progress} className="h-spacing-sm bg-primary/5" />
        </div>
      </Card>

      <div className="space-y-spacing-3xl">
        {/* New Dynamic Achievements */}
        <section className="space-y-spacing-xl">
          <div className="flex items-center gap-spacing-md">
            <h2 className="text-premium-2xl font-bold font-serif">Marcos das Trilhas</h2>
            <div className="flex-1 h-px bg-primary/5" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-lg">
            {dbAchievements.map((ach, i) => {
              const unlocked = earnedAchievementIds.has(ach.id);
              return (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative rounded-[2rem] border p-spacing-lg transition-all duration-700 ${
                    unlocked
                      ? 'bg-primary/[0.03] border-primary/20 shadow-premium'
                      : 'bg-muted/30 border-border opacity-40'
                  }`}
                >
                  <div className="flex items-start gap-spacing-md">
                    <div className="text-premium-4xl bg-background w-spacing-3xl h-spacing-3xl rounded-premium flex items-center justify-center shadow-premium-sm border border-border/50">
                      {ach.icon}
                    </div>
                    <div className="flex-1 space-y-spacing-xs">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-foreground font-serif">{ach.name}</h3>
                        {!unlocked && <Lock className="w-spacing-sm h-spacing-sm text-muted-foreground/40" />}
                      </div>
                      <p className="text-premium-xs text-muted-foreground leading-relaxed">{ach.description}</p>
                      {unlocked && (
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-primary/10 text-primary bg-primary/5">
                          Conquistado
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Legacy Bible Badges */}
        <section className="space-y-spacing-xl">
          <div className="flex items-center gap-spacing-md">
            <h2 className="text-premium-2xl font-bold font-serif">Estudo das Escrituras</h2>
            <div className="flex-1 h-px bg-primary/5" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-spacing-lg">
            {BADGE_DEFINITIONS.map((badge, i) => {
              const unlocked = earnedBadgesLegacy.has(badge.id);
              return (
                <motion.div
                  key={badge.id}
                  className={`p-spacing-lg rounded-[2rem] border transition-all duration-700 flex flex-col items-center text-center space-y-spacing-md ${
                    unlocked ? 'bg-card border-primary/10 shadow-premium' : 'bg-muted/10 border-border opacity-30'
                  }`}
                >
                  <div className={`text-premium-3xl w-spacing-2xl h-spacing-2xl rounded-premium-full flex items-center justify-center ${unlocked ? 'bg-primary/10' : 'bg-muted'}`}>
                    {unlocked ? '🏆' : <Lock className="w-spacing-md h-spacing-md" />}
                  </div>
                  <div className="space-y-spacing-2xs">
                    <h4 className="font-bold text-premium-sm">{badge.name}</h4>
                    <p className="text-[10px] text-muted-foreground line-clamp-spacing-xs">{badge.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AchievementsPage;