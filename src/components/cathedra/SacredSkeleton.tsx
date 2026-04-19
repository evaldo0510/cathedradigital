import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';

/**
 * Elegant skeleton loaders themed for the Cathedra design system.
 * Uses sacred palette + soft shimmer instead of generic gray bars.
 */

const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-primary/5 before:to-transparent";

export const SaintCardSkeleton: React.FC = () => (
  <div className={`bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-xl ${shimmer}`}>
    <div className="flex flex-col md:flex-row">
      <div className="w-full md:w-1/3 h-64 md:h-80 bg-muted/40 flex items-center justify-center">
        <Icons.Cross className="w-10 h-10 text-primary/10" />
      </div>
      <div className="flex-1 p-8 space-y-5">
        <div className="space-y-3">
          <div className="h-3 bg-muted/50 rounded-full w-24" />
          <div className="h-7 bg-muted/60 rounded-full w-3/4" />
          <div className="h-5 bg-muted/40 rounded-full w-1/2" />
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-3 bg-muted/30 rounded-full w-full" />
          <div className="h-3 bg-muted/30 rounded-full w-11/12" />
          <div className="h-3 bg-muted/30 rounded-full w-4/5" />
        </div>
        <div className="grid grid-cols-2 gap-4 pt-3">
          <div className="h-12 bg-muted/30 rounded-xl" />
          <div className="h-12 bg-muted/30 rounded-xl" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="h-12 bg-muted/40 rounded-2xl" />
          <div className="h-12 bg-primary/10 rounded-2xl" />
        </div>
      </div>
    </div>
  </div>
);

export const SaintGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`bg-card border border-border rounded-3xl p-6 space-y-4 ${shimmer}`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
            <Icons.Cross className="w-6 h-6 text-primary/15" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted/60 rounded-full w-3/4" />
            <div className="h-3 bg-muted/40 rounded-full w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2.5 bg-muted/30 rounded-full w-full" />
          <div className="h-2.5 bg-muted/30 rounded-full w-5/6" />
          <div className="h-2.5 bg-muted/30 rounded-full w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

export const BibleChapterSkeleton: React.FC = () => (
  <div className={`max-w-3xl mx-auto px-6 py-8 space-y-6 ${shimmer}`}>
    <div className="flex items-center gap-3 pb-4 border-b border-border">
      <Icons.ScrollText className="w-5 h-5 text-primary/30" />
      <div className="h-6 bg-muted/50 rounded-full w-48" />
    </div>
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex gap-3">
        <div className="h-3 w-6 bg-primary/10 rounded-full mt-2 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-muted/40 rounded-full w-full" />
          <div className="h-3 bg-muted/40 rounded-full" style={{ width: `${70 + Math.random() * 25}%` }} />
          {i % 2 === 0 && (
            <div className="h-3 bg-muted/40 rounded-full" style={{ width: `${50 + Math.random() * 30}%` }} />
          )}
        </div>
      </div>
    ))}
  </div>
);

export const CatechismParagraphSkeleton: React.FC<{ paragraph?: number }> = ({ paragraph }) => (
  <div className={`reader-text leading-[2] text-lg space-y-3 py-4 ${shimmer}`}>
    <div className="flex items-center gap-2 mb-3">
      <Icons.Flame className="w-3 h-3 text-primary/30" />
      <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">
        {paragraph ? `Carregando §${paragraph}...` : 'Carregando...'}
      </span>
    </div>
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="h-4 bg-muted/40 rounded-full"
        style={{ width: `${55 + Math.random() * 40}%` }}
      />
    ))}
  </div>
);

export const SacredSpinner: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      className="relative"
    >
      <Icons.Cross className="w-12 h-12 text-primary/30" />
      <div className="absolute inset-0 blur-xl bg-primary/10 rounded-full" />
    </motion.div>
    {label && (
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
        {label}
      </p>
    )}
  </div>
);
