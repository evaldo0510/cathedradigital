import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Icons } from '../../constants';
import { APPARITIONS, Apparition } from '@/data/apparitions';
import { useFavorites } from '@/hooks/useFavorites';
import DeepContentSection from './DeepContentSection';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';
import { ReaderShell, EditorialHero } from '@/components/reader';
import EditorialClosure from '@/components/reader/EditorialClosure';
import ReaderContinuation from '@/components/shared/ReaderContinuation';
import { cn } from '@/lib/utils';

const AparicoesPage: React.FC = () => {
  const [selectedApparition, setSelectedApparition] = useState<Apparition | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleToggleFavorite = (apparition: Apparition, e?: React.MouseEvent) => {
    e?.stopPropagation();
    toggleFavorite({
      type: 'aparicao',
      title: apparition.title,
      content: apparition.summary,
    });
  };

  if (selectedApparition) {
    const isFav = isFavorite('aparicao', selectedApparition.title);
    
    return (
      <ReaderShell
        ariaLabel={`Aparição — ${selectedApparition.title}`}
        hero={
          <EditorialHero
            kicker={`${selectedApparition.country} · ${selectedApparition.year}`}
            title={selectedApparition.title}
            subtitle={selectedApparition.location}
            meta={selectedApparition.approved ? "Aprovada pela Igreja" : "Em análise"}
            rule
          />
        }
        continuation={
          <div className="space-y-spacing-xl">
            <EditorialClosure
              reflection={selectedApparition.reflexaoFinal}
              application={selectedApparition.aplicacaoPratica}
              prayer={selectedApparition.message}
              next={{
                label: "Voltar às Aparições",
                href: "/aparicoes",
                kicker: "Catálogo"
              }}
            />
            <ReaderContinuation
              context={{
                kind: 'glossary-term', // Usando glossário como fallback de estilo
                id: selectedApparition.id,
              }}
            />
          </div>
        }
      >
        <div className="w-full space-y-spacing-2xl">
          {/* Ações Rápidas */}
          <div className="flex items-center justify-between border-b border-border pb-spacing-md">
            <Button 
              variant="ghost"
              onClick={() => setSelectedApparition(null)} 
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Icons.ChevronLeft className="w-4 h-4" />
              <span>Voltar</span>
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleFavorite(selectedApparition)}
                className={cn(isFav && "text-primary border-primary/30 bg-primary/5")}
              >
                <Icons.Heart className={cn("w-4 h-4 mr-2", isFav && "fill-primary")} />
                {isFav ? "Favorito" : "Salvar"}
              </Button>
            </div>
          </div>

          {/* Seção 1: A História */}
          <section className="space-y-spacing-md">
            <header className="flex items-center gap-3 text-secondary/80">
              <Icons.Book className="w-4 h-4" />
              <span className="text-xs uppercase tracking-[0.2em] font-bold">A Aparição</span>
            </header>
            <div className="font-serif text-foreground/90 leading-[1.8] text-premium-base space-y-4">
              {parseTheologicalReferences(selectedApparition.fullStory).map((seg, i) => {
                if (seg.type === 'bibleRef') return <BibleVersePopover key={i} abbr={seg.abbr!} chapter={seg.chapter!} verse={seg.verse} label={seg.value} />;
                if (seg.type === 'catechismRef') return <CatechismPopover key={i} paragraph={seg.paragraph!} />;
                return <span key={i}>{seg.value}</span>;
              })}
            </div>
          </section>

          {/* Seção 2: O Vidente */}
          <section className="space-y-spacing-md">
            <header className="flex items-center gap-3 text-secondary/80">
              <Icons.Users className="w-4 h-4" />
              <span className="text-xs uppercase tracking-[0.2em] font-bold">Testemunho</span>
            </header>
            <h3 className="text-xl font-bold font-serif">{selectedApparition.seer}</h3>
            <div className="font-serif text-foreground/90 leading-[1.8] text-premium-base">
              {parseTheologicalReferences(selectedApparition.seerStory).map((seg, i) => {
                if (seg.type === 'bibleRef') return <BibleVersePopover key={i} abbr={seg.abbr!} chapter={seg.chapter!} verse={seg.verse} label={seg.value} />;
                if (seg.type === 'catechismRef') return <CatechismPopover key={i} paragraph={seg.paragraph!} />;
                return <span key={i}>{seg.value}</span>;
              })}
            </div>
          </section>

          {/* Seção 3: A Mensagem (Destaque) */}
          <section className="bg-primary/5 border border-primary/10 rounded-premium p-spacing-xl space-y-spacing-md">
             <header className="flex items-center gap-3 text-primary">
              <Icons.Flame className="w-4 h-4" />
              <span className="text-xs uppercase tracking-[0.2em] font-bold">A Mensagem</span>
            </header>
            <blockquote className="font-serif italic text-foreground leading-[1.8] text-premium-lg border-l-2 border-primary/30 pl-6">
              {parseTheologicalReferences(selectedApparition.message).map((seg, i) => {
                if (seg.type === 'bibleRef') return <BibleVersePopover key={i} abbr={seg.abbr!} chapter={seg.chapter!} verse={seg.verse} label={seg.value} />;
                if (seg.type === 'catechismRef') return <CatechismPopover key={i} paragraph={seg.paragraph!} />;
                return <span key={i}>{seg.value}</span>;
              })}
            </blockquote>
          </section>

          {/* Seção 4: Profundidade Teológica */}
          {selectedApparition.textoBase && (
            <section className="pt-spacing-lg border-t border-border">
              <DeepContentSection 
                content={{
                  textoBase: selectedApparition.textoBase,
                  explicacao: selectedApparition.explicacao || '',
                  interpretacaoProfunda: selectedApparition.interpretacaoProfunda || '',
                  aplicacaoPratica: selectedApparition.aplicacaoPratica || '',
                  reflexaoFinal: selectedApparition.reflexaoFinal || '',
                  exercicio: selectedApparition.exercicio || ''
                }} 
                contentType="apparition"
                title="Mistério e Significado" 
              />
            </section>
          )}
        </div>
      </ReaderShell>
    );
  }

  // Overview
  return (
    <ReaderShell
      ariaLabel="Aparições de Nossa Senhora"
      hero={
        <EditorialHero
          kicker="Patrimônio da Fé"
          title="Aparições de Nossa Senhora"
          subtitle="Manifestações da Mãe de Deus aprovadas pela Igreja, convidando a humanidade à oração e conversão."
          rule
        />
      }
    >
      <div className="w-full space-y-spacing-2xl">
        {/* Timeline intro */}
        <div className="flex items-center justify-center gap-spacing-md md:gap-spacing-xl flex-wrap py-spacing-md border-y border-border/50">
          {APPARITIONS.map((a) => (
            <button 
              key={a.id}
              onClick={() => setSelectedApparition(a)}
              className="flex flex-col items-center gap-spacing-2xs group transition-all"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all">
                <img src={a.imageSrc} alt={a.title} className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{a.year}</span>
            </button>
          ))}
        </div>

        {/* Grid de Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-lg">
          {APPARITIONS.map((apparition) => {
            const isFav = isFavorite('aparicao', apparition.title);
            return (
              <div
                key={apparition.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedApparition(apparition)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedApparition(apparition); } }}
                className="group relative flex flex-col bg-card border border-border rounded-premium overflow-hidden hover:border-primary/40 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img src={apparition.imageSrc} alt={apparition.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                  <div className="absolute bottom-4 left-4 right-4">
                     <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em]">{apparition.country} · {apparition.year}</span>
                     <h3 className="text-xl font-serif font-bold text-white mt-1 leading-tight">{apparition.title}</h3>
                  </div>
                </div>
                
                <div className="p-spacing-lg flex flex-col flex-1 gap-spacing-md">
                  <p className="text-premium-sm text-muted-foreground line-clamp-2 leading-relaxed italic">
                    {apparition.summary}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between pt-spacing-sm border-t border-border/50">
                    <div className="flex items-center gap-2 text-primary">
                      <Icons.Flame className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Aprofundar</span>
                    </div>
                    {isFav && <Icons.Heart className="w-4 h-4 text-primary fill-primary" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fundamentação Doutrinária */}
        <div className="mt-spacing-2xl p-spacing-xl bg-card border border-border rounded-premium space-y-4 text-center">
          <Icons.Shield className="w-6 h-6 text-secondary mx-auto" />
          <h3 className="text-lg font-serif font-bold text-foreground">Revelação Privada e Fé Pública</h3>
          <p className="text-premium-sm text-muted-foreground leading-[1.8] max-w-2xl mx-auto italic">
            "A função delas não é completar a Revelação definitiva de Cristo, mas ajudar a vivê-la mais plenamente em determinada época da história" (CIC §67). As aparições marianas aqui catalogadas são aprovadas pela autoridade eclesiástica competente como dignas de fé.
          </p>
        </div>
      </div>
    </ReaderShell>
  );
};

export default AparicoesPage;
