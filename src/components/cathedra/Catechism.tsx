import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import ShareButton from './ShareButton';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import CrossReferencePanel from './CrossReferencePanel';
import NotesPanel from './NotesPanel';
import BibleVersePopover from './BibleVersePopover';
import DeepContentSection from './DeepContentSection';
import { getCatechismCrossRefs } from '@/data/cross-references';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useCatechismParagraph, usePrefetchCatechismParagraph } from '@/hooks/useCatechismParagraph';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import CatechismPopover from './CatechismPopover';


const CatechismContent: React.FC<{ paragraph: number; onNavigateToBible?: (abbr: string, chapter: number) => void }> = ({ paragraph, onNavigateToBible }) => {
  const { data, isLoading, isError } = useCatechismParagraph(paragraph);
  const prefetch = usePrefetchCatechismParagraph();

  useEffect(() => {
    if (paragraph < 2865) prefetch(paragraph + 1);
    if (paragraph > 1) prefetch(paragraph - 1);
  }, [paragraph, prefetch]);

  const segments = useMemo(() => {
    if (!data?.content) return [];
    return parseTheologicalReferences(data.content);
  }, [data?.content]);

  if (isLoading) {
    return (
      <div className="reader-text text-foreground/90 leading-[2] text-lg md:text-xl space-y-3 py-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="reader-text text-destructive font-serif text-base py-8">
        Erro ao carregar o parágrafo §{paragraph}. Verifique sua conexão.
      </div>
    );
  }

  return (
    <div className="reader-text text-foreground/90 leading-[2] text-lg md:text-xl font-serif prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-primary prose-p:my-2">
      {segments.map((seg, i) =>
        seg.type === 'bibleRef' && seg.abbr ? (
          <BibleVersePopover
            key={i}
            abbr={seg.abbr}
            chapter={seg.chapter!}
            verse={seg.verse}
            label={seg.value}
            onNavigate={onNavigateToBible}
          />
        ) : seg.type === 'catechismRef' && seg.paragraph ? (
          <CatechismPopover
            key={i}
            paragraph={seg.paragraph}
          />
        ) : (
          <ReactMarkdown key={i} components={{
            p: ({ children }) => <span>{children}</span>,
          }}>{seg.value}</ReactMarkdown>
        )
      )}
    </div>
  );
};


const CIC_SECTIONS = [
  {
    part: 'Parte I',
    title: 'A Profissão de Fé',
    sections: [
      { id: 1, title: 'Eu Creio — Nós Cremos', paragraphs: [1, 184] },
      { id: 2, title: 'Creio em Deus Pai', paragraphs: [185, 421] },
      { id: 3, title: 'Creio em Jesus Cristo', paragraphs: [422, 682] },
      { id: 4, title: 'Creio no Espírito Santo', paragraphs: [683, 1065] },
    ],
  },
  {
    part: 'Parte II',
    title: 'A Celebração do Mistério Cristão',
    sections: [
      { id: 5, title: 'A Economia Sacramental', paragraphs: [1066, 1209] },
      { id: 6, title: 'Os Sete Sacramentos', paragraphs: [1210, 1690] },
    ],
  },
  {
    part: 'Parte III',
    title: 'A Vida em Cristo',
    sections: [
      { id: 7, title: 'A Vocação do Homem', paragraphs: [1691, 2051] },
      { id: 8, title: 'Os Dez Mandamentos', paragraphs: [2052, 2557] },
    ],
  },
  {
    part: 'Parte IV',
    title: 'A Oração Cristã',
    sections: [
      { id: 9, title: 'A Oração na Vida Cristã', paragraphs: [2558, 2758] },
      { id: 10, title: 'O Pai Nosso', paragraphs: [2759, 2865] },
    ],
  },
];

type ViewMode = 'parts' | 'sections' | 'reading';

const Catechism: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('parts');
  const [selectedPart, setSelectedPart] = useState<typeof CIC_SECTIONS[0] | null>(null);
  const [selectedSection, setSelectedSection] = useState<typeof CIC_SECTIONS[0]['sections'][0] | null>(null);
  const [currentParagraph, setCurrentParagraph] = useState(1);
  const [paragraphsRead, setParagraphsRead] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showCrossRefs, setShowCrossRefs] = useState(true);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();

  const crossRefs = getCatechismCrossRefs(currentParagraph);

  // Track progress
  useEffect(() => {
    if (!user) return;
    const loadProgress = async () => {
      const { data } = await supabase
        .from('catechism_paragraphs_read')
        .select('paragraph')
        .eq('user_id', user.id);
      if (data) {
        setParagraphsRead(new Set(data.map(p => p.paragraph)));
      }
    };
    loadProgress();
  }, [user]);

  const markParagraphRead = useCallback(async (p: number) => {
    if (!user) return;
    try {
      await supabase
        .from('catechism_paragraphs_read')
        .upsert({ user_id: user.id, paragraph: p }, { onConflict: 'user_id,paragraph' });
      setParagraphsRead(prev => new Set([...prev, p]));
    } catch (err) {
      console.error('Failed to mark paragraph read:', err);
    }
  }, [user]);

  useEffect(() => {
    if (viewMode === 'reading' && currentParagraph) {
      markParagraphRead(currentParagraph);
    }
  }, [viewMode, currentParagraph, markParagraphRead]);

  // Handle deep-link from Bible cross-references (?p=1324)
  useEffect(() => {
    const p = searchParams.get('p');
    if (p) {
      const num = parseInt(p);
      if (!isNaN(num) && num >= 1 && num <= 2865) {
        navigateToParagraph(num);
      }
    }
  }, [searchParams]);

  const navigateToParagraph = useCallback((num: number) => {
    for (const part of CIC_SECTIONS) {
      for (const sec of part.sections) {
        if (num >= sec.paragraphs[0] && num <= sec.paragraphs[1]) {
          setSelectedPart(part);
          setSelectedSection(sec);
          setCurrentParagraph(num);
          setViewMode('reading');
          return;
        }
      }
    }
  }, []);

  const handleSearch = () => {
    const num = parseInt(searchQuery);
    if (!isNaN(num) && num >= 1 && num <= 2865) {
      navigateToParagraph(num);
    }
  };

  const handleNavigateToBible = useCallback((abbr: string, chapter: number) => {
    navigate(`/bible?book=${abbr}&ch=${chapter}`);
  }, [navigate]);

  const goBack = () => {
    if (viewMode === 'reading') { setViewMode('sections'); setSelectedSection(null); }
    else if (viewMode === 'sections') { setViewMode('parts'); setSelectedPart(null); }
  };

  // Reading view
  if (viewMode === 'reading' && selectedSection && selectedPart) {
    const [start, end] = selectedSection.paragraphs;
    const fromDashboard = searchParams.get('from') === 'dashboard';
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {fromDashboard && (
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Dashboard
          </button>
        )}
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all">
            <Icons.ArrowDown className="w-5 h-5 rotate-90 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">{selectedPart.part}</span>
            <h1 className="text-xl font-serif font-bold text-foreground truncate">{selectedSection.title}</h1>
            <p className="text-sm text-muted-foreground">§{start} — §{end}</p>
          </div>
          {crossRefs.length > 0 && (
            <button onClick={() => setShowCrossRefs(!showCrossRefs)}
              className={`p-2 rounded-xl border transition-all ${showCrossRefs ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground'}`}
              title="Nexus Theologicus">
              <Icons.Cross className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Paragraph navigator */}
        <div className="flex items-center gap-3 justify-center">
          <button disabled={currentParagraph <= start} onClick={() => setCurrentParagraph(currentParagraph - 1)}
            className="px-3 py-2 rounded-xl bg-card border border-border text-sm font-bold disabled:opacity-30 hover:bg-primary/10 transition-all">
            ← Anterior
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl">
            <span className="text-[10px] font-black text-primary">§</span>
            <input
              type="number" min={start} max={end} value={currentParagraph}
              onChange={e => { const v = parseInt(e.target.value); if (v >= start && v <= end) setCurrentParagraph(v); }}
              className="w-16 text-center bg-transparent text-foreground font-bold text-sm focus:outline-none"
            />
          </div>
          <button disabled={currentParagraph >= end} onClick={() => setCurrentParagraph(currentParagraph + 1)}
            className="px-3 py-2 rounded-xl bg-card border border-border text-sm font-bold disabled:opacity-30 hover:bg-primary/10 transition-all">
            Próximo →
          </button>
        </div>

        {/* Cross references */}
        {showCrossRefs && crossRefs.length > 0 && (
          <CrossReferencePanel
            type="catechism"
            bibleRefs={crossRefs}
            onNavigateToBible={handleNavigateToBible}
          />
        )}

        {/* Content */}
        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 space-y-6">
          <div className="text-center space-y-2 pb-6 border-b border-border">
            <span className="text-3xl font-serif font-bold text-primary">§{currentParagraph}</span>
            <button
              onClick={() => toggleFavorite({ type: 'catechism', title: `CIC §${currentParagraph}`, content: `Catecismo da Igreja Católica, parágrafo §${currentParagraph}` })}
              className="ml-3 inline-flex align-middle"
              title={isFavorite('catechism', `CIC §${currentParagraph}`) ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
            >
              <Icons.Heart className={`w-5 h-5 transition-all ${isFavorite('catechism', `CIC §${currentParagraph}`) ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-primary'}`} />
            </button>
            <ShareButton
              title={`Catecismo §${currentParagraph}`}
              text={`Leia o Catecismo da Igreja Católica, §${currentParagraph} — Cathedra Digital`}
              url={`${window.location.origin}/catechism?p=${currentParagraph}`}
              className="border-0 p-0 hover:bg-transparent"
            />
            <NotesPanel contentType="catechism" contentId={`${currentParagraph}`} contentLabel={`§${currentParagraph}`} />
          </div>
          <CatechismContent paragraph={currentParagraph} onNavigateToBible={handleNavigateToBible} />
          {/* Deep content section for Catechism */}
          {currentParagraph === 1324 && (
            <div className="mt-8 pt-8 border-t border-border">
              <DeepContentSection content={{
                textoBase: "A Eucaristia é «fonte e cume de toda a vida cristã».",
                explicacao: "Isso significa que tudo o que a Igreja faz nasce da Eucaristia e para ela caminha. Não é apenas mais um rito, mas o centro gravitacional de nossa fé.",
                interpretacaoProfunda: "São João Paulo II dizia que a Eucaristia contém todo o bem espiritual da Igreja, ou seja, o próprio Cristo. Ser 'fonte' significa que dela jorra a graça; ser 'cume' significa que não há nada mais alto ou importante a ser alcançado nesta terra.",
                aplicacaoPratica: "Tente colocar a Missa e a Adoração como os pontos centrais da sua semana, não como algo que você encaixa se sobrar tempo, mas como o compromisso do qual tudo o mais depende.",
                reflexaoFinal: "Se a Eucaristia é o sol da minha vida, o que está girando em torno dela hoje?",
                exercicio: "Faça uma visita de 5 minutos ao Santíssimo Sacramento hoje, apenas para reconhecer que Ele é a fonte de tudo o que você tem."
              }} title="Reflexão Doutrinária" />
            </div>
          )}
        </div>

        {/* Quick nav */}
        <div className="flex flex-wrap gap-1 justify-center">
          {Array.from({ length: Math.min(20, end - start + 1) }, (_, i) => start + i).map(p => (
            <button key={p} onClick={() => setCurrentParagraph(p)}
              className={`w-10 h-10 rounded-lg text-xs font-bold transition-all relative ${
                currentParagraph === p ? 'bg-primary text-primary-foreground' : 
                paragraphsRead.has(p) ? 'bg-primary/10 border-primary/30 text-primary' :
                'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}>
              {p}
              {paragraphsRead.has(p) && <Icons.Check className="w-2 h-2 absolute top-1 right-1" />}
            </button>
          ))}
          {end - start + 1 > 20 && <span className="self-center text-muted-foreground text-sm">...</span>}
        </div>
      </div>
    );
  }

  // Section selection
  if (viewMode === 'sections' && selectedPart) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all">
            <Icons.ArrowDown className="w-5 h-5 rotate-90 text-foreground" />
          </button>
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">{selectedPart.part}</span>
            <h1 className="text-3xl font-serif font-bold text-foreground">{selectedPart.title}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedPart.sections.map(sec => (
            <button key={sec.id} onClick={() => { setSelectedSection(sec); setCurrentParagraph(sec.paragraphs[0]); setViewMode('reading'); }}
              className="text-left p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Seção {sec.id}</span>
              <h3 className="text-lg font-serif font-bold text-foreground mt-2 group-hover:text-primary transition-colors">{sec.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">§{sec.paragraphs[0]} — §{sec.paragraphs[1]}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Parts overview
  return (
    <>
    <SEOHead title="Catecismo da Igreja Católica" description="Acesse o Catecismo da Igreja Católica online. Estude a doutrina católica organizada por partes, seções e parágrafos." path="/catechism" keywords="catecismo online, catecismo da igreja católica, doutrina católica, CIC" breadcrumbs={[{ name: "Início", path: "/" }, { name: "Catecismo", path: "/catechism" }]} />
    <motion.div
      className="max-w-5xl mx-auto space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div 
        className="text-center space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Cross className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Codex Fidei</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Catecismo da Igreja Católica</h1>
        <p className="text-muted-foreground font-serif italic">2.865 parágrafos organizados em 4 partes fundamentais.</p>
        <div className="max-w-xs mx-auto pt-4">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">
            <span>Seu Progresso</span>
            <span>{Math.round((paragraphsRead.size / 2865) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(paragraphsRead.size / 2865) * 100}%` }}
              className="h-full bg-primary"
            />
          </div>
        </div>
      </motion.div>

      {/* Suggestion Card */}
      {nextUnreadParagraph && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div 
            onClick={() => navigateToParagraph(nextUnreadParagraph)}
            className="max-w-md mx-auto p-4 rounded-2xl border border-primary/20 bg-primary/5 cursor-pointer hover:border-primary/40 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                <Icons.Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Continuar Formação</p>
                <h3 className="text-sm font-bold text-foreground">Sugerido: §{nextUnreadParagraph}</h3>
              </div>
            </div>
            <Icons.ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>
      )}

      {/* Search by paragraph */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por número do parágrafo (ex: 1324)..."
            className="w-full pl-11 pr-20 py-3 rounded-2xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button onClick={handleSearch} className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-foreground text-background rounded-xl text-xs font-bold">
            Ir
          </button>
        </div>
      </div>

      {/* Parts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CIC_SECTIONS.map(part => (
          <button key={part.part} onClick={() => { setSelectedPart(part); setViewMode('sections'); }}
            className="text-left p-5 md:p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{part.part}</span>
            <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mt-3 group-hover:text-primary transition-colors">{part.title}</h2>
            <p className="text-sm text-muted-foreground mt-2">{part.sections.length} seções</p>
            <div className="flex flex-wrap gap-1 mt-4">
              {part.sections.map(s => (
                <span key={s.id} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-lg text-[10px] font-bold">{s.title.split(' ').slice(0, 3).join(' ')}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </motion.div>
    </>
  );
};

export default Catechism;
