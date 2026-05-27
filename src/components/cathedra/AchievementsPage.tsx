import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { BADGE_DEFINITIONS } from '@/lib/badges';
import { Progress } from '@/components/ui/progress';
import { Trophy, Lock } from 'lucide-react';

const AchievementsPage: React.FC = () => {
  const { profile } = useAuth();
  const earnedBadges = useMemo(() => new Set(profile?.badges || []), [profile?.badges]);
  const totalEarned = BADGE_DEFINITIONS.filter(b => earnedBadges.has(b.id)).length;
  const progress = Math.round((totalEarned / BADGE_DEFINITIONS.length) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-premium-sm">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="text-premium-tiny font-black uppercase tracking-[0.2em] text-primary">Conquistas</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Suas Conquistas</h1>
        <p className="text-muted-foreground font-serif italic">Marcos de leitura e dedicação ao estudo das Escrituras.</p>
      </div>

      {/* Summary */}
      <div className="bg-card border border-border rounded-premium-sm p-5 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-foreground">{totalEarned} de {BADGE_DEFINITIONS.length} conquistas</span>
          <span className="font-bold text-primary">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2.5" />
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BADGE_DEFINITIONS.map((badge, i) => {
          const unlocked = earnedBadges.has(badge.id);
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`relative rounded-full border p-5 transition-all ${
                unlocked
                  ? 'bg-primary/5 border-primary/30 shadow-soft'
                  : 'bg-card border-border opacity-60'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`text-4xl flex-shrink-0 ${unlocked ? '' : 'grayscale'}`}>
                  {badge.icon}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground text-sm">{badge.name}</h3>
                    {!unlocked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
                {unlocked && (
                  <div className="flex-shrink-0 px-2.5 py-1 bg-primary/15 rounded-premium-sm">
                    <span className="text-premium-tiny font-black uppercase tracking-widest text-primary">Conquistado</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsPage;
