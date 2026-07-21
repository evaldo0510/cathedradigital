import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';

export interface LiturgyPsalmCardProps {
  reference: string;
  refrain: string;
  text: string;
  onOpenBible: () => void;
  onOpenLectio: () => void;
  delay?: number;
}

export const LiturgyPsalmCard: React.FC<LiturgyPsalmCardProps> = ({
  reference,
  refrain,
  text,
  onOpenBible,
  onOpenLectio,
  delay = 0,
}) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="space-y-spacing-lg premium-card p-spacing-xl group relative overflow-hidden"
      aria-labelledby="reading-psalm-label"
    >
      <div className="absolute top-0 right-0 p-spacing-xl opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <Icons.Music className="w-spacing-md h-spacing-md" />
      </div>
      <header className="flex items-center gap-spacing-sm relative z-10">
        <div className="p-spacing-xs rounded-premium bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-premium-md">
          <Icons.Music className="w-spacing-md h-spacing-md" />
        </div>
        <div>
          <h2 id="reading-psalm-label" className="text-premium-xs font-black uppercase tracking-[0.25em] text-primary">
            Salmo Responsorial
          </h2>
          <p className="text-premium-xs font-bold text-secondary/60 uppercase tracking-[0.2em] mt-spacing-3xs">
            {reference}
          </p>
        </div>
      </header>
      {refrain && (
        <div className="bg-secondary/5 rounded-premium p-spacing-lg border border-secondary/20 border-l-4 shadow-premium-md">
          <p className="text-premium-lg font-serif italic text-primary leading-relaxed antialiased">
            ℟ {refrain}
          </p>
        </div>
      )}
      <p className="text-premium-lg md:text-premium-xl leading-[1.8] text-primary font-serif whitespace-pre-line selection:bg-secondary/30 antialiased tracking-tight">
        {text}
      </p>
      <footer className="flex flex-wrap gap-spacing-sm pt-spacing-lg border-t border-border/40">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-premium-full h-spacing-xl px-spacing-lg hover:bg-primary hover:text-white transition-all"
          onClick={onOpenBible}
        >
          <Icons.Bible className="w-spacing-md h-spacing-md mr-spacing-xs" /> Bíblia
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="rounded-premium-full ml-auto h-spacing-xl px-spacing-xl bg-secondary/10 border-none hover:bg-secondary/20 text-primary shadow-premium-md"
          onClick={onOpenLectio}
        >
          <Icons.Lectio className="w-spacing-md h-spacing-md mr-spacing-xs text-secondary" /> Lectio Divina
        </Button>
      </footer>
    </motion.article>
  );
};

export default LiturgyPsalmCard;
