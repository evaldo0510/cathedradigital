import React from 'react';
import { Card } from '@/components/ui/card';
import { ContentSkeleton } from './primitives/ContentSkeleton';

/**
 * SacredSkeleton — consolidado no Sprint P2.2 (Logos 2030).
 * APIs preservadas; toda animação/pulse local substituída pela primitiva
 * `ContentSkeleton` (shimmer único, tokens Stitch, respeita reduced-motion).
 */

export const PageHeaderSkeleton: React.FC = () => (
  <div
    className="text-center space-y-spacing-md pt-spacing-xl mb-spacing-xl flex flex-col items-center"
    aria-hidden="true"
    aria-busy="true"
  >
    <ContentSkeleton variant="circle" className="w-spacing-2xl h-spacing-2xl" />
    <ContentSkeleton variant="block" className="h-spacing-xl w-[280px]" />
    <ContentSkeleton variant="block" className="h-spacing-md w-[220px]" />
  </div>
);

export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-spacing-lg">
    {Array.from({ length: count }).map((_, i) => (
      <Card
        key={i}
        className="h-spacing-4xl rounded-premium border border-border/40 shadow-premium-md overflow-hidden"
      >
        <ContentSkeleton variant="block" className="h-full w-full rounded-none" />
      </Card>
    ))}
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-spacing-md">
    {Array.from({ length: count }).map((_, i) => (
      <ContentSkeleton key={i} variant="block" className="h-spacing-3xl border border-border/30" />
    ))}
  </div>
);

/**
 * Item de busca (Santos, Glossário, etc.). Preserva silhueta do SearchResultCard.
 */
export const SearchResultSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-spacing-xs" aria-hidden="true" aria-busy="true">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="p-spacing-sm flex items-center gap-spacing-sm bg-card/50 border border-border/10 rounded-premium h-[76px]"
      >
        <ContentSkeleton variant="block" className="flex-shrink-0 w-spacing-xl h-spacing-xl" />
        <div className="flex-1 space-y-spacing-xs">
          <ContentSkeleton variant="block" className="h-spacing-sm w-1/3" />
          <ContentSkeleton variant="block" className="h-spacing-xs w-2/3" />
        </div>
        <ContentSkeleton variant="block" className="w-spacing-xl h-spacing-md" />
      </div>
    ))}
  </div>
);

export const TagSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="flex flex-wrap gap-spacing-xs" aria-hidden="true" aria-busy="true">
    {Array.from({ length: count }).map((_, i) => (
      <ContentSkeleton key={i} variant="pill" className="h-[32px] w-[80px]" />
    ))}
  </div>
);

export const SaintCardSkeleton: React.FC = () => (
  <div
    className="bg-card border border-border rounded-[2.5rem] overflow-hidden h-spacing-4xl"
    aria-hidden="true"
    aria-busy="true"
  >
    <div className="flex flex-col md:flex-row h-full">
      <ContentSkeleton
        variant="block"
        className="w-full md:w-[240px] h-spacing-4xl md:h-auto rounded-none"
      />
      <div className="flex-1 p-spacing-xl space-y-spacing-lg">
        <ContentSkeleton variant="block" className="h-spacing-md w-[220px]" />
        <ContentSkeleton variant="block" className="h-spacing-xl w-[260px]" />
        <ContentSkeleton variant="text" lines={3} />
      </div>
    </div>
  </div>
);

export const SaintGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-spacing-md">
    {Array.from({ length: count }).map((_, i) => (
      <ContentSkeleton key={i} variant="block" className="h-spacing-4xl" />
    ))}
  </div>
);

export const BibleChapterSkeleton: React.FC = () => (
  <div className="space-y-spacing-lg" aria-hidden="true" aria-busy="true">
    <ContentSkeleton variant="block" className="h-spacing-xl w-[280px] mx-auto" />
    <div className="space-y-spacing-md">
      {Array.from({ length: 15 }).map((_, i) => (
        <ContentSkeleton key={i} variant="block" className="h-spacing-md w-full" />
      ))}
    </div>
  </div>
);

export const CatechismParagraphSkeleton: React.FC<{ paragraph?: number }> = () => (
  <div className="space-y-spacing-md py-spacing-md" aria-hidden="true" aria-busy="true">
    <div className="flex items-center gap-spacing-xs">
      <ContentSkeleton variant="block" className="h-spacing-xl w-spacing-2xl" />
      <div className="h-px flex-1 bg-muted/30" />
    </div>
    <ContentSkeleton variant="text" lines={3} />
  </div>
);

export const LogosChatSkeleton = () => (
  <div className="flex flex-col h-full space-y-spacing-lg p-spacing-md" aria-hidden="true" aria-busy="true">
    <div className="flex justify-start gap-spacing-sm">
      <ContentSkeleton variant="circle" className="w-spacing-xl h-spacing-xl shrink-0" />
      <div className="space-y-spacing-xs">
        <ContentSkeleton variant="block" className="h-spacing-3xl w-[200px] rounded-tl-none" />
        <ContentSkeleton variant="block" className="h-spacing-sm w-spacing-2xl" />
      </div>
    </div>
    <div className="flex justify-end gap-spacing-sm">
      <div className="space-y-spacing-xs">
        <ContentSkeleton variant="block" className="h-spacing-2xl w-[150px] rounded-tr-none" />
        <ContentSkeleton variant="block" className="h-spacing-sm w-spacing-2xl ml-auto" />
      </div>
      <ContentSkeleton variant="circle" className="w-spacing-xl h-spacing-xl shrink-0" />
    </div>
    <div className="flex justify-start gap-spacing-sm pt-spacing-md">
      <ContentSkeleton variant="circle" className="w-spacing-xl h-spacing-xl shrink-0" />
      <div className="space-y-spacing-xs">
        <ContentSkeleton variant="block" className="h-spacing-4xl w-[240px] rounded-tl-none" />
        <ContentSkeleton variant="block" className="h-spacing-sm w-spacing-2xl" />
      </div>
    </div>
  </div>
);

export const ReadingSkeleton = () => (
  <div
    className="w-full max-w-3xl mx-auto space-y-spacing-xl py-spacing-2xl animate-in fade-in duration-700"
    aria-hidden="true"
    aria-busy="true"
  >
    <div className="space-y-spacing-md flex flex-col items-center">
      <ContentSkeleton variant="block" className="h-spacing-md w-[180px]" />
      <ContentSkeleton variant="block" className="h-spacing-xl w-[320px]" />
    </div>
    <div className="space-y-spacing-lg pt-spacing-xl">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex gap-spacing-md">
          <ContentSkeleton variant="block" className="h-spacing-md w-spacing-lg shrink-0 mt-spacing-2xs" />
          <div className="space-y-spacing-xs flex-1">
            <ContentSkeleton variant="block" className={`h-spacing-md ${i % 2 === 0 ? 'w-full' : 'w-[95%]'}`} />
            <ContentSkeleton variant="block" className={`h-spacing-md ${i % 3 === 0 ? 'w-[50%]' : 'w-[90%]'}`} />
          </div>
        </div>
      ))}
    </div>
  </div>
);
