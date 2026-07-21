import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';

export type LiturgyReadingKind = 'first' | 'second' | 'gospel';

const LABEL: Record<LiturgyReadingKind, string> = {
  first: 'Primeira Leitura',
  second: 'Segunda Leitura',
  gospel: 'Evangelho',
};

function iconFor(kind: LiturgyReadingKind) {
  if (kind === 'gospel') return <Icons.Flame className="w-spacing-md h-spacing-md" />;
  return <Icons.Bible className="w-spacing-md h-spacing-md" />;
}

export interface LiturgyReadingCardProps {
  kind: LiturgyReadingKind;
  reference: string;
  text: string;
  onOpenBible: () => void;
  onOpenLectio: () => void;
  delay?: number;
}

export const LiturgyReadingCard: React.FC<LiturgyReadingCardProps> = ({
  kind,
  reference,
  text,
  onOpenBible,
  onOpenLectio,
  delay = 0,
}) => {
  const icon = iconFor(kind);
  const label = LABEL[kind];
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="space-y-spacing-lg premium-card p-spacing-xl group relative overflow-hidden"
      aria-labelledby={`reading-${kind}-label`}
    >
      <div className="absolute top-0 right-0 p-spacing-xl opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        {icon}
      </div>
      <header className="flex items-center gap-spacing-sm relative z-10">
        <div className="p-spacing-xs rounded-premium bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-premium-md">
          {icon}
        </div>
        <div>
          <h2 id={`reading-${kind}-label`} className="text-premium-xs font-black uppercase tracking-[0.25em] text-primary">
            {label}
          </h2>
          <p className="text-premium-xs font-bold text-secondary/60 uppercase tracking-[0.2em] mt-spacing-3xs">
            {reference}
          </p>
        </div>
      </header>
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

export default LiturgyReadingCard;
