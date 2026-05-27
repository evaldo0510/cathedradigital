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
    <div
      id="reading-progress"
      className="group relative overflow-hidden cursor-pointer transition-all duration-700"
      onClick={() => lastRead.url && navigate(lastRead.url)}
    >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="flex items-center gap-10">
            <div className="w-16 h-16 rounded-full bg-primary/[0.01] flex items-center justify-center text-primary/10 group-hover:scale-110 group-hover:text-primary/25 transition-all duration-1000 border border-primary/[0.02]">
              <Clock className="w-8 h-8" strokeWidth={0.5} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/20">
                  {lastRead.content_type === 'bible' ? 'Escrituras' : 
                   lastRead.content_type === 'catechism' ? 'Catecismo' : 
                   lastRead.content_type === 'magisterium' ? 'Magistério' : 'Conteúdo'}
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-display font-medium text-primary/80 tracking-tight leading-tight">
                {lastRead.label || 'Continuar de onde parou'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/10 group-hover:text-primary/30 transition-colors">
                Retomar
              </p>
            </div>
            <div className="w-14 h-14 rounded-full border border-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-1000 shadow-premium-sm">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>
        
        {/* Subtle progress indicator */}
        <div className="absolute bottom-[-32px] left-[-32px] w-[calc(100%+64px)] h-1 bg-primary/[0.02]">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: lastRead.position ? `${Math.min(lastRead.position, 100)}%` : '5%' }} 
            className="h-full bg-primary/20"
          />
        </div>
    </div>
  );
};