import React, { useState, useTransition, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '../../constants';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';
import { Button } from '@/components/ui/button';
import { type Saint } from '@/data/saints';

interface Props {
  saint: Saint;
  onReflect: () => void;
  autoReflect?: boolean;
}

/** Renderiza texto com detecção de referências bíblicas/CIC. */
const RichText: React.FC<{ text: string; className?: string }> = ({ text, className }) => (
  <div className={className}>
    {parseTheologicalReferences(text).map((seg, i) => {
      if (seg.type === 'bibleRef')
        return <BibleVersePopover key={i} abbr={seg.abbr!} chapter={seg.chapter!} verse={seg.verse} label={seg.value} />;
      if (seg.type === 'catechismRef')
        return <CatechismPopover key={i} paragraph={seg.paragraph!} />;
      return <span key={i}>{seg.value}</span>;
    })}
  </div>
);

const TAB_SKELETON_MS = 220;

const SaintDetailTabs: React.FC<Props> = ({ saint, onReflect, autoReflect }) => {
  const [tab, setTab] = useState<'historia' | 'virtude' | 'padroeiro' | 'reflexao'>(
    autoReflect ? 'reflexao' : 'historia'
  );
  const [isPending, startTransition] = useTransition();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [reflecting, setReflecting] = useState(false);

  useEffect(() => {
    if (autoReflect) setTab('reflexao');
  }, [autoReflect]);

  const changeTab = (next: typeof tab) => {
    if (next === tab) return;
    setShowSkeleton(true);
    startTransition(() => setTab(next));
    const t = setTimeout(() => setShowSkeleton(false), TAB_SKELETON_MS);
    return () => clearTimeout(t);
  };

  const virtues = saint.virtues && saint.virtues.length > 0 ? saint.virtues : ['Santidade'];
  const patronOf = saint.patronOf && saint.patronOf.length > 0 ? saint.patronOf : [];
  const loading = isPending || showSkeleton;

  return (
    <section aria-label="Aspectos da vida do santo" className="space-y-spacing-md">
      <Tabs value={tab} onValueChange={(v) => changeTab(v as typeof tab)} className="w-full">
        <TabsList
          className="grid grid-cols-2 md:grid-cols-4 w-full bg-secondary/40 p-spacing-2xs rounded-premium h-auto"
          aria-label="Seções do santo"
        >
          <TabsTrigger value="historia" className="text-premium-xs font-black uppercase tracking-widest gap-spacing-2xs">
            <Icons.Info className="w-spacing-sm h-spacing-sm" aria-hidden="true" />
            História
          </TabsTrigger>
          <TabsTrigger value="virtude" className="text-premium-xs font-black uppercase tracking-widest gap-spacing-2xs">
            <Icons.Shield className="w-spacing-sm h-spacing-sm" aria-hidden="true" />
            Virtude
          </TabsTrigger>
          <TabsTrigger value="padroeiro" className="text-premium-xs font-black uppercase tracking-widest gap-spacing-2xs">
            <Icons.Heart className="w-spacing-sm h-spacing-sm" aria-hidden="true" />
            Padroeiro(a)
          </TabsTrigger>
          <TabsTrigger value="reflexao" className="text-premium-xs font-black uppercase tracking-widest gap-spacing-2xs">
            <Icons.Sparkles className="w-spacing-sm h-spacing-sm" aria-hidden="true" />
            Refletir
          </TabsTrigger>
        </TabsList>

        <div
          className="mt-spacing-lg min-h-[180px]"
          role="region"
          aria-live="polite"
          aria-busy={loading}
        >
          {loading ? (
            <div className="space-y-spacing-sm" aria-hidden="true">
              <Skeleton className="h-spacing-md w-1/3" />
              <Skeleton className="h-spacing-md w-full" />
              <Skeleton className="h-spacing-md w-11/12" />
              <Skeleton className="h-spacing-md w-9/12" />
            </div>
          ) : (
            <>
              <TabsContent value="historia" className="focus-visible:outline-none">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <RichText
                    text={saint.bio || ''}
                    className="text-premium-lg font-serif italic text-foreground/90 leading-relaxed border-l-4 border-primary/20 pl-spacing-lg py-spacing-2xs"
                  />
                  {saint.fullBio && (
                    <div className="mt-spacing-lg text-muted-foreground leading-relaxed text-premium-sm space-y-spacing-md">
                      {saint.fullBio.split('\n\n').map((p, i) => (
                        <RichText key={i} text={p} />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="virtude" className="focus-visible:outline-none">
                <div className="space-y-spacing-md">
                  <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">
                    Virtude Principal
                  </p>
                  <p className="text-premium-2xl font-serif text-primary">{virtues[0]}</p>
                  {virtues.length > 1 && (
                    <div className="flex flex-wrap gap-spacing-xs pt-spacing-sm">
                      {virtues.slice(1).map((v) => (
                        <span
                          key={v}
                          className="px-spacing-sm py-spacing-2xs bg-primary/5 text-primary text-premium-xs font-black uppercase rounded-premium-full tracking-wider"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-premium-sm text-muted-foreground font-serif italic pt-spacing-md">
                    A vida de {saint.name} é um convite a cultivar{' '}
                    <span className="text-primary font-bold not-italic">{virtues[0].toLowerCase()}</span> nas
                    circunstâncias ordinárias do dia.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="padroeiro" className="focus-visible:outline-none">
                {patronOf.length > 0 ? (
                  <div className="space-y-spacing-md">
                    <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">
                      Padroeiro(a) de
                    </p>
                    <div className="flex flex-wrap gap-spacing-xs">
                      {patronOf.map((p) => (
                        <span
                          key={p}
                          className="px-spacing-md py-spacing-xs bg-secondary/40 text-foreground text-premium-sm font-serif rounded-premium-full border border-border"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-spacing-lg">
                    <Icons.Heart className="w-spacing-xl h-spacing-xl text-muted-foreground/40 mx-auto mb-spacing-sm" />
                    <p className="text-premium-sm text-muted-foreground font-serif italic">
                      Nenhum patronato específico registrado para {saint.name}.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reflexao" className="focus-visible:outline-none">
                <div className="space-y-spacing-md">
                  <p className="text-premium-sm text-muted-foreground font-serif italic">
                    Refletir com Logos sobre a vida e o testemunho de {saint.name}, aplicando à sua jornada
                    espiritual de hoje.
                  </p>
                  <Button
                    onClick={() => {
                      setReflecting(true);
                      onReflect();
                      setTimeout(() => setReflecting(false), 800);
                    }}
                    aria-busy={reflecting}
                    disabled={reflecting}
                    className="h-spacing-2xl px-spacing-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-premium-xs tracking-[0.2em] rounded-premium-full"
                  >
                    {reflecting ? (
                      <>
                        <Icons.Loader className="w-spacing-md h-spacing-md mr-spacing-xs animate-spin" />
                        Preparando reflexão…
                      </>
                    ) : (
                      <>
                        <Icons.Sparkles className="w-spacing-md h-spacing-md mr-spacing-xs" />
                        Refletir com Logos
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </section>
  );
};

export default SaintDetailTabs;
