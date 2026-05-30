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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-lg md:gap-xl">
          <div className="flex items-center gap-lg md:gap-xl">
            <div className="w-2xl h-2xl rounded-full bg-primary/[0.005] flex items-center justify-center text-primary/30 group-hover:scale-105 group-hover:text-primary/50 transition-all duration-1000 border border-primary/[0.01]">
              <Clock className="w-lg h-lg" strokeWidth={0.5} />
            </div>
            <div className="space-y-xs md:space-y-md">
              <div className="flex items-center gap-md">
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-primary/40">
                  {lastRead.content_type === 'bible' ? 'Escrituras' : 
                   lastRead.content_type === 'catechism' ? 'Catecismo' : 
                   lastRead.content_type === 'magisterium' ? 'Magistério' : 'Conteúdo'}
                </span>
              </div>
              <h4 className="text-lg md:text-3xl font-display font-medium text-primary/80 tracking-tight leading-tight">
                {lastRead.label || 'Continuar de onde parou'}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-md md:gap-xl">
            <div className="text-right hidden sm:block">
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-primary/40 group-hover:text-primary/60 transition-colors">
                Retomar
              </p>
            </div>
            <div className="w-xl h-xl rounded-full border border-primary/[0.01] flex items-center justify-center text-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-1000">
              <ArrowRight className="w-md h-md" />
            </div>
          </div>
        </div>
        
        {/* Subtle progress indicator */}
        <div className="absolute bottom-[-32px] left-[-32px] w-[calc(100%+64px)] h-2xs bg-primary/[0.02]">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: lastRead.position ? `${Math.min(lastRead.position, 100)}%` : '5%' }} 
            className="h-full bg-primary/20"
          />
        </div>
    </div>
  );
};