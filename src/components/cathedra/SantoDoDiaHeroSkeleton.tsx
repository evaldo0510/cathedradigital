import React from 'react';

/**
 * Skeleton do SantoDoDiaHero — mantém a mesma silhueta (hero + ficha em blocos)
 * para evitar layout shift enquanto os dados (com fallbacks) são resolvidos.
 */
const SantoDoDiaHeroSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Carregando Santo do Dia"
      className="relative overflow-hidden rounded-[2.5rem] border border-border/60 bg-card shadow-premium-hover animate-pulse"
    >
      {/* Hero image + overlay editorial */}
      <div className="relative">
        <div className="h-[38vh] min-h-[320px] md:h-[52vh] md:min-h-[420px] w-full bg-muted/60" />
        <div className="absolute inset-x-0 bottom-0 p-spacing-lg md:p-spacing-2xl">
          <div className="max-w-3xl space-y-spacing-sm">
            <div className="h-spacing-sm w-[42%] rounded-premium-full bg-muted/80" />
            <div className="h-spacing-2xl w-[70%] rounded-premium bg-muted/80" />
            <div className="h-spacing-md w-[55%] rounded-premium bg-muted/70" />
            <div className="flex flex-wrap gap-spacing-2xs pt-spacing-xs">
              <div className="h-spacing-md w-[110px] rounded-premium-full bg-muted/70" />
              <div className="h-spacing-md w-[90px] rounded-premium-full bg-muted/60" />
              <div className="h-spacing-md w-[140px] rounded-premium-full bg-muted/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Ficha editorial */}
      <div className="p-spacing-lg md:p-spacing-2xl space-y-spacing-2xl">
        {/* Meta-strip 4 col */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-spacing-md border-b border-border/60 pb-spacing-lg">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-spacing-3xs">
              <div className="h-spacing-xs w-[60%] rounded-premium bg-muted/70" />
              <div className="h-spacing-md w-[80%] rounded-premium bg-muted/60" />
            </div>
          ))}
        </div>

        {/* Frase marcante */}
        <div className="pl-spacing-lg border-l-2 border-primary/30 space-y-spacing-xs">
          <div className="h-spacing-md w-[95%] rounded-premium bg-muted/60" />
          <div className="h-spacing-md w-[80%] rounded-premium bg-muted/60" />
        </div>

        {/* Blocos Vida / Legado */}
        <div className="grid md:grid-cols-2 gap-spacing-xl">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-spacing-sm">
              <div className="h-spacing-sm w-[30%] rounded-premium bg-muted/70" />
              <div className="space-y-spacing-2xs">
                <div className="h-spacing-sm w-full rounded-premium bg-muted/50" />
                <div className="h-spacing-sm w-full rounded-premium bg-muted/50" />
                <div className="h-spacing-sm w-[92%] rounded-premium bg-muted/50" />
                <div className="h-spacing-sm w-[70%] rounded-premium bg-muted/50" />
              </div>
            </div>
          ))}
        </div>

        {/* Meditação */}
        <div className="rounded-[2rem] border border-primary/15 bg-primary/5 p-spacing-xl space-y-spacing-sm">
          <div className="h-spacing-sm w-[40%] rounded-premium bg-muted/70" />
          <div className="h-spacing-md w-full rounded-premium bg-muted/50" />
          <div className="h-spacing-md w-[85%] rounded-premium bg-muted/50" />
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-spacing-sm pt-spacing-xs">
          <div className="flex-1 h-spacing-2xl rounded-premium-full bg-muted/60" />
          <div className="flex-1 h-spacing-2xl rounded-premium-full bg-muted/60" />
          <div className="h-spacing-2xl w-[120px] rounded-premium-full bg-muted/50" />
        </div>
      </div>

      <span className="sr-only">Carregando Santo do Dia…</span>
    </div>
  );
};

export const SantoDoDiaSecondaryListSkeleton: React.FC<{ count?: number }> = ({
  count = 4,
}) => (
  <section
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label="Carregando outras memórias do dia"
    className="space-y-spacing-lg pt-spacing-lg animate-pulse"
  >
    <div className="flex items-baseline justify-between border-b border-border/60 pb-spacing-xs">
      <div className="h-spacing-md w-[220px] rounded-premium bg-muted/70" />
      <div className="h-spacing-xs w-[80px] rounded-premium bg-muted/60" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-md">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="premium-card overflow-hidden flex"
        >
          <div className="w-spacing-4xl h-spacing-4xl shrink-0 bg-muted/60" />
          <div className="flex-1 p-spacing-md space-y-spacing-2xs">
            <div className="h-spacing-xs w-[50%] rounded-premium bg-muted/70" />
            <div className="h-spacing-md w-[85%] rounded-premium bg-muted/60" />
            <div className="h-spacing-xs w-[70%] rounded-premium bg-muted/50" />
          </div>
        </div>
      ))}
    </div>
    <span className="sr-only">Carregando outras memórias do dia…</span>
  </section>
);

export default SantoDoDiaHeroSkeleton;
