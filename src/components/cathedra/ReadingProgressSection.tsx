import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReadingMarks } from '@/hooks/useReadingMarks';
import { CathedraCard } from './CathedraCard';
import { Icons } from '@/constants';
import { ArrowRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeader } from './SectionHeader';

export const ReadingProgressSection: React.FC = () => {
  const navigate = useNavigate();
  const { marks, loading } = useReadingMarks();

  const lastRead = marks.find(m => m.is_last_read) || marks[0];

  if (loading || !lastRead) return null;

  return (
    <section className="space-y-12">
      <SectionHeader 
        title="Continuar Leitura" 
        subtitle="Onde a alma parou para contemplar."
      />

      <div
        className="group relative overflow-hidden p-12 md:p-16 lg:p-20 rounded-premium-lg border border-border/5 bg-card/5 backdrop-blur-md cursor-pointer transition-all duration-1000 shadow-premium hover:bg-card/10"
        onClick={() => lastRead.url && navigate(lastRead.url)}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-12">
          <div className="flex items-center gap-12">
            <div className="w-20 h-20 rounded-full bg-primary/[0.02] flex items-center justify-center text-primary/20 group-hover:scale-110 transition-all duration-1000 border border-primary/5">
              <Clock className="w-10 h-10" strokeWidth={0.5} />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary/30">
                  {lastRead.content_type === 'bible' ? 'Escrituras' : 
                   lastRead.content_type === 'catechism' ? 'Catecismo' : 
                   lastRead.content_type === 'magisterium' ? 'Magistério' : 'Conteúdo'}
                </span>
              </div>
              <h3 className="text-4xl font-display font-medium text-primary tracking-tight leading-tight">
                {lastRead.label || 'Continuar de onde parou'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-primary/10 group-hover:text-primary/30 transition-colors">
                Retomar
              </p>
            </div>
            <div className="w-16 h-16 rounded-full border border-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-1000 shadow-premium">
              <ArrowRight className="w-6 h-6" />
            </div>
          </div>
        </div>
        
        {/* Subtle progress indicator */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/[0.02]">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: lastRead.position ? `${Math.min(lastRead.position, 100)}%` : '5%' }} 
            className="h-full bg-primary/20"
          />
        </div>
      </div>
    </section>
  );
};