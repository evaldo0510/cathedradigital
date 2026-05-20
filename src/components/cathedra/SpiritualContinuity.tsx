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
}

export const SpiritualContinuity: React.FC<SpiritualContinuityProps> = ({ data, isLoading }) => {
  const navigate = useNavigate();
  const { t } = useLang();

  if (isLoading || !data) return null;

  const { nextBible, nextCatechism, nextJourney, lastReflection, lastJournal, history } = data;

  // Prioridade de retomada
  const primaryResume = nextJourney || nextBible || nextCatechism;

  if (!primaryResume && (!history || history.length === 0)) return null;

  return (
    <div className="space-y-8">
      {/* Visual Progress - Discreto */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-premium-tiny font-bold uppercase tracking-[0.4em] text-primary/40">Continuidade Espiritual</h3>
        <div className="flex items-center gap-2">
          <div className="h-1 w-24 bg-border/20 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '65%' }} // Exemplo: Valor vindo de algum cálculo de maturidade
              className="h-full bg-secondary/40"
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-[10px] font-bold text-secondary/60 uppercase tracking-widest">Maturidade II</span>
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
              {formatDistanceToNow(new Date(lastReflection?.date || lastJournal?.date), { addSuffix: true, locale: ptBR })}
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
                whileHover={{ y: -4 }}
                onClick={() => navigate(item.route)}
                className="flex-shrink-0 w-64 p-5 rounded-3xl bg-card border border-border/40 cursor-pointer group transition-all hover:border-secondary/30 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-muted/30 flex items-center justify-center text-muted-foreground group-hover:text-secondary transition-colors">
                     <Icons.History size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest truncate">{item.title || 'Atividade'}</p>
                    <p className="text-[10px] text-muted-foreground/40 truncate mt-1">
                      {formatDistanceToNow(new Date(item.visited_at), { addSuffix: true, locale: ptBR })}
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
