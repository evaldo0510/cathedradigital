import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Cinematic breathing animation for premium skeletons
 */
const BreathWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("animate-cinematic-breath", className)}>
    {children}
  </div>
);

export const PageHeaderSkeleton: React.FC = () => (
  <BreathWrapper className="text-center space-y-6 pt-12 mb-16">
    <div className="w-16 h-16 mx-auto rounded-premium bg-primary/[0.03] border border-primary/5 shadow-premium" />
    <div className="h-12 w-80 mx-auto bg-primary/[0.05] rounded-premium" />
    <div className="h-4 w-64 mx-auto bg-primary/[0.02] rounded-full" />
  </BreathWrapper>
);

export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
    {Array.from({ length: count }).map((_, i) => (
      <BreathWrapper key={i}>
        <Card className="h-64 rounded-[3rem] bg-primary/[0.015] border border-primary/[0.03] shadow-soft" />
      </BreathWrapper>
    ))}
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-6">
    {Array.from({ length: count }).map((_, i) => (
      <BreathWrapper key={i}>
        <div className="h-24 rounded-[2rem] bg-primary/[0.01] border border-primary/[0.02]" />
      </BreathWrapper>
    ))}
  </div>
);

export const BibleChapterSkeleton: React.FC = () => (
  <div className="space-y-16 max-w-[65ch] mx-auto py-24">
    <BreathWrapper className="text-center">
      <div className="h-12 w-56 bg-primary/[0.05] rounded-full mx-auto mb-20 opacity-40" />
    </BreathWrapper>
    <div className="space-y-16">
      {Array.from({ length: 6 }).map((_, i) => (
        <BreathWrapper key={i} className="flex gap-10">
          <div className="h-5 w-8 bg-primary/[0.04] rounded-full shrink-0 mt-1.5" />
          <div className="space-y-4 flex-1">
            <div className="h-5 w-full bg-primary/[0.03] rounded-full" />
            <div className="h-5 w-[92%] bg-primary/[0.02] rounded-full" />
            {i % 2 === 0 && <div className="h-5 w-[85%] bg-primary/[0.01] rounded-full" />}
          </div>
        </BreathWrapper>
      ))}
    </div>
  </div>
);

export const CatechismParagraphSkeleton: React.FC<{ paragraph?: number }> = ({ paragraph }) => (
  <BreathWrapper className="space-y-6 py-12 max-w-[65ch] mx-auto">
    <div className="flex items-center gap-4">
      <div className="h-10 w-16 bg-primary/[0.05] rounded-xl" />
      <div className="h-[0.5px] flex-1 bg-primary/[0.03]" />
    </div>
    <div className="space-y-4">
      <div className="h-5 w-full bg-primary/[0.03] rounded-full" />
      <div className="h-5 w-full bg-primary/[0.02] rounded-full" />
      <div className="h-5 w-[80%] bg-primary/[0.01] rounded-full" />
    </div>
  </BreathWrapper>
);

export const LogosChatSkeleton = () => (
  <div className="flex flex-col h-full space-y-10 p-6">
    <BreathWrapper className="flex justify-start gap-4">
      <div className="w-10 h-10 rounded-full bg-primary/[0.04] shrink-0" />
      <div className="space-y-3">
        <div className="h-20 w-[240px] rounded-3xl rounded-tl-none bg-primary/[0.02] border border-primary/[0.01]" />
        <div className="h-3 w-16 bg-primary/[0.02] rounded-full" />
      </div>
    </BreathWrapper>
    <BreathWrapper className="flex justify-end gap-4">
      <div className="space-y-3 items-end flex flex-col">
        <div className="h-16 w-[180px] rounded-3xl rounded-tr-none bg-primary/[0.05] border border-primary/[0.02]" />
        <div className="h-3 w-16 bg-primary/[0.02] rounded-full" />
      </div>
      <div className="w-10 h-10 rounded-full bg-primary/[0.06] shrink-0" />
    </BreathWrapper>
    <BreathWrapper className="flex justify-start gap-4 pt-4">
      <div className="w-10 h-10 rounded-full bg-primary/[0.04] shrink-0" />
      <div className="space-y-3">
        <div className="h-32 w-[300px] rounded-3xl rounded-tl-none bg-primary/[0.02] border border-primary/[0.01]" />
        <div className="h-3 w-16 bg-primary/[0.02] rounded-full" />
      </div>
    </BreathWrapper>
  </div>
);

export const ReadingSkeleton = () => (
  <div className="w-full max-w-[65ch] mx-auto space-y-12 py-20">
    <BreathWrapper className="space-y-6 text-center">
      <div className="h-5 w-32 mx-auto bg-primary/[0.04] rounded-full" />
      <div className="h-12 w-4/5 mx-auto bg-primary/[0.06] rounded-full" />
    </BreathWrapper>
    <div className="space-y-8 pt-12">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <BreathWrapper key={i} className="flex gap-6">
          <div className="h-5 w-8 shrink-0 mt-1 bg-primary/[0.03] rounded-full" />
          <div className="space-y-3 flex-1">
            <div className={cn("h-5 bg-primary/[0.04] rounded-full", i % 2 === 0 ? 'w-full' : 'w-[95%]')} />
            <div className={cn("h-5 bg-primary/[0.02] rounded-full", i % 3 === 0 ? 'w-4/5' : 'w-[90%]')} />
          </div>
        </BreathWrapper>
      ))}
    </div>
  </div>
);
