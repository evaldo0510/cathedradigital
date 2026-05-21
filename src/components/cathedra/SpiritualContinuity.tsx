import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { HomeCard } from './HomeCard';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SpiritualContinuityProps {
  data: any;
  isLoading?: boolean;
  profile?: any;
}

export const SpiritualContinuity: React.FC<SpiritualContinuityProps> = ({ data, isLoading, profile }) => {
  const navigate = useNavigate();
  const { t } = useLang();

  if (isLoading || !data) return null;

  const { nextBible, nextCatechism, nextJourney, lastReflection, lastJournal, history, primaryResume: dashboardPrimary } = data;

  // Calculo discreto de maturidade baseado em XP
  const xp = profile?.xp || 0;
  // Degrees: I, II, III, IV, V... based on XP
  const romanDegrees = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const degreeIndex = Math.floor(xp / 1000);
  const currentDegree = romanDegrees[degreeIndex] || `X+${degreeIndex - 9}`;
  const progressToNextLevel = (xp % 1000) / 10; 

  // Prioridade de retomada: use a marca de leitura exata se disponível, senão caia nos calculados
  const primaryResume = dashboardPrimary || nextJourney || nextBible || nextCatechism;

  if (!primaryResume && (!history || history.length === 0)) return null;

  return (
    <div className="space-y-12">
      {/* Visual Progress - Minimalista e Nobre */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-8 w-full">
           <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
           <h3 className="text-premium-tiny font-black uppercase tracking-[0.6em] text-primary/30">Caminho de Maturidade</h3>
           <div className="h-px flex-1 bg-gradient-to-l from-transparent via-primary/10 to-transparent" />
        </div>
        
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.3em]">Grau {currentDegree}</span>
          <div className="h-[2px] w-32 bg-border/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(5, progressToNextLevel)}%` }}
              className="h-full bg-secondary/30"
              transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.3em]">Grau {romanDegrees[degreeIndex + 1] || '?'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de Retomada Principal */}
        {primaryResume && (
          <HomeCard 
            onClick={() => navigate(primaryResume.route)}
            className="lg:col-span-2 p-8 group relative overflow-hidden flex flex-col justify-between min-h-[220px] rounded-[2.5rem] border-border/20"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               {primaryResume.type === 'bible' && <Icons.Bible size={120} strokeWidth={0.5} />}
               {primaryResume.type === 'journey' && <Icons.Journeys size={120} strokeWidth={0.5} />}
               {primaryResume.type === 'catechism' && <Icons.Catechism size={120} strokeWidth={0.5} />}
            </div>

            <div className="space-y-4 relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary/60">{primaryResume.subtitle}</span>
              <h4 className="text-3xl font-display font-medium text-primary leading-tight max-w-md">{primaryResume.label}</h4>
            </div>

            <div className="flex items-center justify-between relative z-10 pt-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-serif italic opacity-60">
                 <Icons.Clock size={14} />
                 <span>Retomar agora</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-premium">
                <Icons.Play size={20} fill="currentColor" />
              </div>
            </div>
          </HomeCard>
        )}

        {/* Card de Última Reflexão */}
        <HomeCard className="p-8 flex flex-col justify-between bg-secondary/[0.02] border-secondary/10 rounded-[2.5rem]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-secondary/60">
              <Icons.Quote size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Sua Última Reflexão</span>
            </div>
            {lastReflection ? (
              <p className="text-base font-serif italic text-primary/70 line-clamp-4 leading-relaxed">
                "{lastReflection.content}"
              </p>
            ) : lastJournal ? (
              <p className="text-base font-serif italic text-primary/70 line-clamp-4 leading-relaxed">
                "{lastJournal.content}"
              </p>
            ) : (
              <p className="text-sm text-muted-foreground/30 font-serif italic">Nenhuma reflexão recente registrada.</p>
            )}
          </div>

          {(lastReflection || lastJournal) && (
            <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter pt-4">
              {(() => {
                const date = lastReflection?.date || lastJournal?.date;
                if (!date) return '';
                try {
                  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
                } catch (e) {
                  return '';
                }
              })()}
            </div>
          )}
        </HomeCard>
      </div>

      {/* Histórico Elegante */}
      {history && history.length > 0 && (
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/30 px-2">Caminho da Fé</p>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
            {history.map((item: any, idx: number) => (
              <motion.div
                key={item.id || idx}
                whileHover={{ y: -4, borderColor: 'rgba(var(--secondary), 0.3)' }}
                onClick={() => navigate(item.route)}
                className="flex-shrink-0 w-72 p-6 rounded-[2rem] bg-card border border-border/40 cursor-pointer group transition-all shadow-sm hover:shadow-premium"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors">
                       <Icons.History size={14} />
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-tighter">
                      {(() => {
                        if (!item.visited_at) return '';
                        try {
                          return formatDistanceToNow(new Date(item.visited_at), { addSuffix: true, locale: ptBR });
                        } catch (e) {
                          return '';
                        }
                      })()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest truncate">
                      {item.title || item.route?.split('/').pop()?.replace(/-/g, ' ') || 'Peregrinação'}
                    </p>
                    <p className="text-xs font-serif italic text-muted-foreground/60 truncate">
                      Retomar leitura profunda
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
