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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back + Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedApparition(null)} className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all">
            <Icons.ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">{selectedApparition.country} • {selectedApparition.year}</span>
            <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground">{selectedApparition.title}</h1>
            <p className="text-sm text-muted-foreground">{selectedApparition.location}</p>
          </div>
          <button
            onClick={() => handleToggleFavorite(selectedApparition)}
            className={`p-2 rounded-xl border transition-all ${isFav ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground hover:text-primary hover:border-primary/30'}`}
            title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Icons.Heart className={`w-5 h-5 ${isFav ? 'fill-primary' : ''}`} />
          </button>
          <img src={selectedApparition.imageSrc} alt={selectedApparition.title} className="w-16 h-16 rounded-xl object-cover shadow-md" loading="lazy" />
        </div>

        {/* Quick facts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Data', value: selectedApparition.date },
            { label: 'Vidente(s)', value: selectedApparition.seer.split(',')[0] },
            { label: 'Festa Litúrgica', value: selectedApparition.liturgicalFeast },
            { label: 'Status', value: selectedApparition.approved ? 'Aprovada pela Igreja' : 'Em análise' },
          ].map(fact => (
            <div key={fact.label} className="p-3 rounded-xl bg-card border border-border">
              <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">{fact.label}</p>
              <p className="text-xs font-semibold text-foreground">{fact.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {[
            { id: 'historia' as const, label: 'A Aparição', icon: <Icons.Book className="w-3.5 h-3.5" /> },
            { id: 'vidente' as const, label: 'O Vidente', icon: <Icons.Users className="w-3.5 h-3.5" /> },
            { id: 'mensagem' as const, label: 'A Mensagem', icon: <Icons.Heart className="w-3.5 h-3.5" /> },
            { id: 'profundidade' as const, label: 'Profundidade', icon: <Icons.Star className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
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
            className="bg-card border border-border rounded-2xl p-6 md:p-8"
          >
            {activeTab === 'historia' && (
              <div className="space-y-4">
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
              <div className="space-y-4">
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
              <div className="space-y-6">
                <h2 className="text-lg font-serif font-bold text-foreground">A Mensagem de Maria</h2>
                <blockquote className="border-l-4 border-primary pl-4 py-2">
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
              <DeepContentSection content={{
                textoBase: selectedApparition.textoBase,
                explicacao: selectedApparition.explicacao || '',
                interpretacaoProfunda: selectedApparition.interpretacaoProfunda || '',
                aplicacaoPratica: selectedApparition.aplicacaoPratica || '',
                reflexaoFinal: selectedApparition.reflexaoFinal || '',
                exercicio: selectedApparition.exercicio || ''
              }} title="Mistério e Significado" />
            )}
            {activeTab === 'profundidade' && !selectedApparition.textoBase && (
              <div className="text-center py-12 space-y-4">
                <Icons.Search className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Heart className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Aparições Marianas</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Aparições de Nossa Senhora</h1>
        <p className="text-muted-foreground font-serif italic max-w-2xl mx-auto">
          As principais manifestações da Mãe de Deus ao longo da história, aprovadas pela Igreja Católica.
        </p>
      </div>

      {/* Timeline intro */}
      <div className="flex items-center justify-center gap-4 md:gap-6 flex-wrap">
        {APPARITIONS.map((a, i) => (
          <React.Fragment key={a.id}>
            <div className="flex flex-col items-center gap-1">
              <img src={a.imageSrc} alt={a.title} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shadow-sm" loading="lazy" />
              <span className="text-[9px] font-black text-primary">{a.year}</span>
            </div>
            {i < APPARITIONS.length - 1 && (
              <div className="hidden md:block w-6 h-px bg-border" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Apparition cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {APPARITIONS.map((apparition, index) => {
          const isFav = isFavorite('aparicao', apparition.title);
          return (
            <motion.button
              key={apparition.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => { setSelectedApparition(apparition); setActiveTab('historia'); }}
              className={`text-left rounded-2xl bg-gradient-to-br ${apparition.color} border hover:scale-[1.02] transition-all group overflow-hidden relative`}
            >
              <div className="relative">
                <img src={apparition.imageSrc} alt={apparition.title} className="w-full h-40 object-cover" loading="lazy" />
                <button
                  onClick={(e) => handleToggleFavorite(apparition, e)}
                  className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all ${isFav ? 'bg-primary/20 text-primary' : 'bg-black/30 text-white/80 hover:text-white'}`}
                  title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <Icons.Heart className={`w-4 h-4 ${isFav ? 'fill-primary' : ''}`} />
                </button>
              </div>
              <div className="p-5">
                <div className="mb-3">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">{apparition.country} • {apparition.year}</span>
                  <h2 className="text-lg md:text-xl font-serif font-bold text-foreground mt-1 group-hover:text-primary transition-colors">
                    {apparition.title}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{apparition.summary}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icons.Users className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">{apparition.seer.split(',')[0]}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Ler com profundidade →</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Catechism reference */}
      <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3">
        <Icons.Cross className="w-6 h-6 text-primary mx-auto" />
        <h3 className="font-serif font-bold text-foreground">Fundamentação no Catecismo</h3>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          O Catecismo da Igreja Católica (§67) ensina que as revelações privadas "não pertencem ao depósito da fé",
          mas podem "ajudar a viver" a fé em determinada época. As aparições aprovadas são um convite à conversão e à oração.
        </p>
      </div>
    </div>
  );
};

export default AparicoesPage;
