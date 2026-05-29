import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const BreathWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("animate-cinematic-breath", className)}>
    {children}
  </div>
);

export const BibleSkeleton = () => (
  <div className="w-full max-w-7xl mx-auto space-y-16 py-12 px-6" role="status" aria-live="polite" aria-busy="true">
    <span className="sr-only">Carregando Bíblia Sagrada...</span>
    <BreathWrapper className="space-y-8 text-center">
      <div className="w-16 h-16 rounded-[2rem] bg-primary/[0.03] border border-primary/10 mx-auto" />
      <div className="h-12 w-80 bg-primary/[0.05] rounded-full mx-auto" />
      <div className="h-4 w-56 bg-primary/[0.02] rounded-full mx-auto" />
    </BreathWrapper>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <BreathWrapper key={i}>
          <Card className="h-48 rounded-[3rem] bg-primary/[0.015] border border-primary/[0.03]" />
        </BreathWrapper>
      ))}
    </div>
  </div>
);

export const CatechismSkeleton = () => (
  <div className="w-full max-w-5xl mx-auto space-y-16 py-12 px-6" role="status" aria-live="polite" aria-busy="true">
    <span className="sr-only">Carregando Catecismo da Igreja Católica...</span>
    <BreathWrapper className="space-y-8 text-center">
      <div className="w-16 h-16 rounded-[2rem] bg-primary/[0.03] border border-primary/10 mx-auto" />
      <div className="h-12 w-96 bg-primary/[0.05] rounded-full mx-auto" />
    </BreathWrapper>

    <div className="space-y-12 max-w-3xl mx-auto">
      {[1, 2, 3].map((i) => (
        <BreathWrapper key={i} className="space-y-6">
          <div className="h-10 w-64 bg-primary/[0.04] rounded-full" />
          <div className="space-y-3">
            <div className="h-5 w-full bg-primary/[0.02] rounded-full" />
            <div className="h-5 w-full bg-primary/[0.02] rounded-full" />
            <div className="h-5 w-2/3 bg-primary/[0.01] rounded-full" />
          </div>
        </BreathWrapper>
      ))}
    </div>
  </div>
);

export const LogosSkeleton = () => (
  <div className="w-full max-w-4xl mx-auto h-[75vh] flex flex-col space-y-8 md:space-y-12 py-8 md:py-12 px-6" role="status" aria-live="polite" aria-busy="true">
    <span className="sr-only">Carregando Logos IA...</span>
    <BreathWrapper className="flex items-center gap-6 border-b border-primary/[0.02] pb-10">
      <div className="w-16 h-16 rounded-[2rem] bg-primary/[0.03] border border-primary/10" />
      <div className="space-y-3">
        <div className="h-5 w-48 bg-primary/[0.05] rounded-full" />
        <div className="h-3.5 w-32 bg-primary/[0.02] rounded-full" />
      </div>
    </BreathWrapper>
    
    <div className="flex-1 space-y-12 overflow-hidden">
      <BreathWrapper className="flex justify-start gap-5">
        <div className="w-10 h-10 rounded-full bg-primary/[0.04]" />
        <div className="h-24 w-2/3 bg-primary/[0.02] rounded-[2rem] rounded-tl-none" />
      </BreathWrapper>
      <BreathWrapper className="flex justify-end gap-5">
        <div className="h-16 w-1/2 bg-primary/[0.05] rounded-[2rem] rounded-tr-none" />
        <div className="w-10 h-10 rounded-full bg-primary/[0.06]" />
      </BreathWrapper>
      <BreathWrapper className="flex justify-start gap-5">
        <div className="w-10 h-10 rounded-full bg-primary/[0.04]" />
        <div className="h-40 w-3/4 bg-primary/[0.02] rounded-[2rem] rounded-tl-none" />
      </BreathWrapper>
    </div>
    
    <BreathWrapper className="pt-10 border-t border-primary/[0.02]">
      <div className="h-16 w-full bg-primary/[0.01] rounded-full border border-primary/[0.05]" />
    </BreathWrapper>
  </div>
);
