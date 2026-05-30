import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Icons } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { APPARITIONS, Apparition } from '@/data/apparitions';
import { useFavorites } from '@/hooks/useFavorites';
import DeepContentSection from './DeepContentSection';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';

const AparicoesPage: React.FC = () => {
  const [selectedApparition, setSelectedApparition] = useState<Apparition | null>(null);
  const [activeTab, setActiveTab] = useState<'historia' | 'vidente' | 'mensagem' | 'profundidade'>('historia');
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
      <div className="max-w-spacing-4xl mx-auto space-y-spacing-lg">
        {/* Back + Header */}
        <div className="flex items-center gap-spacing-md">
          <Button onClick={() => setSelectedApparition(null)} className="p-spacing-xs rounded-full bg-card border border-border hover:bg-primary/10 transition-all">
            <Icons.ChevronLeft className="w-spacing-md h-spacing-md text-foreground" />
          </Button>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">{selectedApparition.country} • {selectedApparition.year}</span>
            <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground">{selectedApparition.title}</h1>
            <p className="text-sm text-muted-foreground">{selectedApparition.location}</p>
          </div>
          <Button
            onClick={() => handleToggleFavorite(selectedApparition)}
            className={`p-spacing-xs rounded-full border transition-all ${isFav ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground hover:text-primary hover:border-primary/30'}`}
            title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Icons.Heart className={`w-spacing-md h-spacing-md ${isFav ? 'fill-primary' : ''}`} />
          </Button>
          <img src={selectedApparition.imageSrc} alt={selectedApparition.title} className="w-spacing-3xl h-spacing-3xl rounded-full object-cover shadow-premium" loading="lazy" />
        </div>

        {/* Quick facts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-spacing-sm">
          {[
            { label: 'Data', value: selectedApparition.date },
            { label: 'Vidente(s)', value: selectedApparition.seer.split(',')[0] },
            { label: 'Festa Litúrgica', value: selectedApparition.liturgicalFeast },
            { label: 'Status', value: selectedApparition.approved ? 'Aprovada pela Igreja' : 'Em análise' },
          ].map(fact => (
            <div key={fact.label} className="p-spacing-sm rounded-premium bg-card border border-border">
              <p className="text-xs font-black uppercase tracking-widest text-primary mb-spacing-2xs">{fact.label}</p>
              <p className="text-xs font-semibold text-foreground">{fact.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-spacing-2xs p-spacing-2xs bg-muted rounded-premium">
          {[
            { id: 'historia' as const, label: 'A Aparição', icon: <Icons.Book className="w-spacing-sm h-spacing-sm" /> },
            { id: 'vidente' as const, label: 'O Vidente', icon: <Icons.Users className="w-spacing-sm h-spacing-sm" /> },
            { id: 'mensagem' as const, label: 'A Mensagem', icon: <Icons.Heart className="w-spacing-sm h-spacing-sm" /> },
            { id: 'profundidade' as const, label: 'Profundidade', icon: <Icons.Star className="w-spacing-sm h-spacing-sm" /> },
          ].map(tab => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-spacing-xs py-spacing-xs rounded-full text-xs font-bold transition-all ${
                activeTab === tab.id ? 'bg-card text-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border rounded-full p-spacing-lg md:p-spacing-xl"
          >
            {activeTab === 'historia' && (
              <div className="space-y-spacing-md">
                <h2 className="text-lg font-serif font-bold text-foreground">A História da Aparição</h2>
                <p className="font-serif text-foreground/90 leading-[1.9] text-base">
                  {parseTheologicalReferences(selectedApparition.fullStory).map((seg, i) => {
                    if (seg.type === 'bibleRef') return <BibleVersePopover key={i} abbr={seg.abbr!} chapter={seg.chapter!} verse={seg.verse} label={seg.value} />;
                    if (seg.type === 'catechismRef') return <CatechismPopover key={i} paragraph={seg.paragraph!} />;
                    return <span key={i}>{seg.value}</span>;
                  })}
                </p>
              </div>
            )}
            {activeTab === 'vidente' && (
              <div className="space-y-spacing-md">
                <h2 className="text-lg font-serif font-bold text-foreground">
                  {selectedApparition.seer}
                </h2>
                <p className="font-serif text-foreground/90 leading-[1.9] text-base">
                  {parseTheologicalReferences(selectedApparition.seerStory).map((seg, i) => {
                    if (seg.type === 'bibleRef') return <BibleVersePopover key={i} abbr={seg.abbr!} chapter={seg.chapter!} verse={seg.verse} label={seg.value} />;
                    if (seg.type === 'catechismRef') return <CatechismPopover key={i} paragraph={seg.paragraph!} />;
                    return <span key={i}>{seg.value}</span>;
                  })}
                </p>
              </div>
            )}
            {activeTab === 'mensagem' && (
              <div className="space-y-spacing-lg">
                <h2 className="text-lg font-serif font-bold text-foreground">A Mensagem de Maria</h2>
                <blockquote className="border-l-4 border-primary pl-spacing-md py-spacing-xs">
                  <p className="font-serif italic text-foreground/90 leading-[1.9] text-base">
                    {parseTheologicalReferences(selectedApparition.message).map((seg, i) => {
                      if (seg.type === 'bibleRef') return <BibleVersePopover key={i} abbr={seg.abbr!} chapter={seg.chapter!} verse={seg.verse} label={seg.value} />;
                      if (seg.type === 'catechismRef') return <CatechismPopover key={i} paragraph={seg.paragraph!} />;
                      return <span key={i}>{seg.value}</span>;
                    })}
                  </p>
                </blockquote>
              </div>
            )}
            {activeTab === 'profundidade' && selectedApparition.textoBase && (
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
            )}
            {activeTab === 'profundidade' && !selectedApparition.textoBase && (
              <div className="text-center py-spacing-2xl space-y-spacing-md">
                <Icons.Search className="w-spacing-2xl h-spacing-2xl text-muted-foreground mx-auto opacity-20" />
                <p className="text-muted-foreground italic font-serif">Conteúdo profundo em preparação para esta aparição.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Overview
  return (
    <div className="max-w-5xl mx-auto space-y-spacing-xl">
      {/* Header */}
      <div className="text-center space-y-spacing-sm">
        <div className="inline-flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs bg-primary/10 rounded-premium">
          <Icons.Heart className="w-spacing-md h-spacing-md text-primary" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Aparições Marianas</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Aparições de Nossa Senhora</h1>
        <p className="text-muted-foreground font-serif italic max-w-spacing-2xl mx-auto">
          As principais manifestações da Mãe de Deus ao longo da história, aprovadas pela Igreja Católica.
        </p>
      </div>

      {/* Timeline intro */}
      <div className="flex items-center justify-center gap-spacing-md md:gap-spacing-lg flex-wrap">
        {APPARITIONS.map((a, i) => (
          <React.Fragment key={a.id}>
            <div className="flex flex-col items-center gap-spacing-2xs">
              <img src={a.imageSrc} alt={a.title} className="w-spacing-xl h-spacing-xl md:w-spacing-2xl md:h-spacing-2xl rounded-full object-cover shadow-md" loading="lazy" />
              <span className="text-xs font-black text-primary">{a.year}</span>
            </div>
            {i < APPARITIONS.length - 1 && (
              <div className="hidden md:block w-spacing-lg h-px bg-border" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Apparition cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-md">
        {APPARITIONS.map((apparition, index) => {
          const isFav = isFavorite('aparicao', apparition.title);
          return (
            <motion.button
              key={apparition.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => { setSelectedApparition(apparition); setActiveTab('historia'); }}
              className={`text-left rounded-full bg-gradient-to-br ${apparition.color} border hover:scale-[1.02] transition-all group overflow-hidden relative`}
            >
              <div className="relative">
                <img src={apparition.imageSrc} alt={apparition.title} className="w-full h-spacing-4xl object-cover" loading="lazy" />
                <Button
                  onClick={(e) => handleToggleFavorite(apparition, e)}
                  className={`absolute top-spacing-sm right-spacing-sm p-spacing-xs rounded-full  transition-all ${isFav ? 'bg-primary/20 text-primary' : 'bg-black/30 text-white/80 hover:text-white'}`}
                  title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <Icons.Heart className={`w-spacing-md h-spacing-md ${isFav ? 'fill-primary' : ''}`} />
                </Button>
              </div>
              <div className="p-spacing-md">
                <div className="mb-spacing-sm">
                  <span className="text-xs font-black text-primary uppercase tracking-widest">{apparition.country} • {apparition.year}</span>
                  <h2 className="text-lg md:text-xl font-serif font-bold text-foreground mt-spacing-2xs group-hover:text-primary transition-colors">
                    {apparition.title}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground mb-spacing-sm line-clamp-2">{apparition.summary}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-spacing-xs text-muted-foreground">
                    <Icons.Users className="w-spacing-sm h-spacing-sm" />
                    <span className="text-xs font-bold">{apparition.seer.split(',')[0]}</span>
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-primary">Ler com profundidade →</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Catechism reference */}
      <div className="bg-card border border-border rounded-premium p-spacing-lg text-center space-y-spacing-sm">
        <Icons.Cross className="w-spacing-lg h-spacing-lg text-primary mx-auto" />
        <h3 className="font-serif font-bold text-foreground">Fundamentação no Catecismo</h3>
        <p className="text-sm text-muted-foreground max-w-spacing-xl mx-auto">
          O Catecismo da Igreja Católica (§67) ensina que as revelações privadas "não pertencem ao depósito da fé",
          mas podem "ajudar a viver" a fé em determinada época. As aparições aprovadas são um convite à conversão e à oração.
        </p>
      </div>
    </div>
  );
};

export default AparicoesPage;
