import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReadingMarks } from '@/hooks/useReadingMarks';
import { CathedraCard } from './CathedraCard';
import { Icons } from '@/constants';
import { ArrowRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ReadingProgressSection: React.FC = () => {
  const navigate = useNavigate();
  const { marks, loading } = useReadingMarks();

  const lastRead = marks.find(m => m.is_last_read) || marks[0];

  if (loading || !lastRead) return null;

  return (
    <section className="space-y-12 md:space-y-16">
      <div className="flex items-center gap-10">
        <div className="h-px flex-1 bg-border/30" />
        <h2 className="text-premium-tiny font-bold uppercase tracking-[0.6em] text-primary/30 whitespace-nowrap">
          Continuar Leitura
        </h2>
        <div className="h-px flex-1 bg-border/30" />
      </div>

      <CathedraCard
        variant="interactive"
        className="group relative overflow-hidden p-8 md:p-12 border-border/10 hover:border-primary/20 transition-all shadow-premium hover:shadow-premium-hover"
        onClick={() => lastRead.url && navigate(lastRead.url)}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="w-14 h-14 rounded-premium bg-primary/[0.02] flex items-center justify-center text-primary/40 group-hover:scale-105 transition-all duration-700 border border-border/10">
              <Clock className="w-6 h-6" strokeWidth={1} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/40">
                  {lastRead.content_type === 'bible' ? 'Escrituras' : 
                   lastRead.content_type === 'catechism' ? 'Catecismo' : 
                   lastRead.content_type === 'magisterium' ? 'Magistério' : 'Conteúdo'}
                </span>
                <div className="w-1 h-1 rounded-full bg-primary/20" />
                <span className="text-[10px] font-medium text-muted-foreground/40 italic">
                  {new Date(lastRead.updated_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <h3 className="text-2xl font-display font-medium text-primary tracking-tight group-hover:text-primary transition-colors">
                {lastRead.label || 'Continuar de onde parou'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/20 group-hover:text-primary/40 transition-colors">
                Retomar agora
              </p>
            </div>
            <div className="w-12 h-12 rounded-full border border-border/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground transition-all duration-500">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
        
        {/* Subtle progress indicator */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-border/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '40%' }} // Dummy progress for now
            className="h-full bg-primary/20"
          />
        </div>
      </CathedraCard>
    </section>
  );
};