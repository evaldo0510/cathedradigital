import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';
import SacredImage from './SacredImage';
import ShareButton from './ShareButton';
import DocumentViewer from './DocumentViewer';
import DeepContentSection from './DeepContentSection';
import { type Saint } from '@/data/saints';
import { AppRoute } from '@/types';
import { BookOpen, Quote, Shield, Info, Heart, Lightbulb, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';
import AudioContentPlayer from './AudioContentPlayer';

export const CATEGORY_LABELS: Record<string, string> = {
  apostle: 'Apóstolo',
  martyr: 'Mártir',
  doctor: 'Doutor(a) da Igreja',
  virgin: 'Virgem',
  confessor: 'Confessor',
  pope: 'Papa',
  founder: 'Fundador(a)',
  mystic: 'Místico(a)',
};

const VIRTUE_TO_JOURNEY: Record<string, { id: string, name: string }> = {
  'paciência': { id: '0b8ddab7-b106-4873-bc4d-3987421d265d', name: 'Rotina de Transformação' },
  'fé': { id: 'b25b02f4-0533-483f-9a7b-c2e866e6f25d', name: 'Mística' },
  'identidade': { id: '150f78d3-019b-40c0-962e-a83576309ea5', name: 'Coração' },
  'dor': { id: 'f0f35259-85b3-44fa-99c1-4f9ec87c9f4d', name: 'Cura' },
  'perseverança': { id: '0b8ddab7-b106-4873-bc4d-3987421d265d', name: 'Rotina de Transformação' },
  'humildade': { id: '0b8ddab7-b106-4873-bc4d-3987421d265d', name: 'Rotina de Transformação' },
  'contemplação': { id: 'b25b02f4-0533-483f-9a7b-c2e866e6f25d', name: 'Mística' },
  'oração': { id: 'b25b02f4-0533-483f-9a7b-c2e866e6f25d', name: 'Mística' },
  'silêncio': { id: 'b25b02f4-0533-483f-9a7b-c2e866e6f25d', name: 'Mística' },
  'penitência': { id: 'f0f35259-85b3-44fa-99c1-4f9ec87c9f4d', name: 'Cura' },
  'cura': { id: 'f0f35259-85b3-44fa-99c1-4f9ec87c9f4d', name: 'Cura' },
  'esperança': { id: '150f78d3-019b-40c0-962e-a83576309ea5', name: 'Coração' },
  'caridade': { id: '150f78d3-019b-40c0-962e-a83576309ea5', name: 'Coração' },
  'sabedoria': { id: 'b25b02f4-0533-483f-9a7b-c2e866e6f25d', name: 'Mística' },
  'fidelidade': { id: '0b8ddab7-b106-4873-bc4d-3987421d265d', name: 'Rotina de Transformação' },
  'perdão': { id: 'f0f35259-85b3-44fa-99c1-4f9ec87c9f4d', name: 'Cura' },
  'santidade': { id: 'b25b02f4-0533-483f-9a7b-c2e866e6f25d', name: 'Mística' },
  'sofrimento': { id: 'f0f35259-85b3-44fa-99c1-4f9ec87c9f4d', name: 'Cura' },
  'vocação': { id: 'b1b2c3d4-3333-4000-8000-000000000003', name: 'Discernimento Vocacional' },
  'missão': { id: '0b8ddab7-b106-4873-bc4d-3987421d265d', name: 'Rotina de Transformação' },
};

const SaintDetail: React.FC<{ saint: Saint; onClose: () => void; autoReflect?: boolean }> = ({ saint, onClose, autoReflect = false }) => {
  const { isPremium } = useAuth();
  const navigate = useNavigate();
  const [viewingDoc, setViewingDoc] = useState<{ url: string; title: string } | null>(null);

  const suggestedJourney = React.useMemo(() => {
    const mainVirtue = saint.virtues?.[0]?.toLowerCase() || 'santidade';
    
    // Direct match
    if (VIRTUE_TO_JOURNEY[mainVirtue]) return VIRTUE_TO_JOURNEY[mainVirtue];
    
    // Keyword match
    for (const v of (saint.virtues || [])) {
      const lv = v.toLowerCase();
      const foundKey = Object.keys(VIRTUE_TO_JOURNEY).find(key => lv.includes(key));
      if (foundKey) return VIRTUE_TO_JOURNEY[foundKey];
    }
    
    return VIRTUE_TO_JOURNEY['paciência']; // Default
  }, [saint.virtues]);

  return (
    <>
    <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-background/95 z-[100] flex items-center justify-center p-2 md:p-8 backdrop-blur-xl"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      className="bg-card rounded-[2.5rem] max-w-5xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-border flex flex-col md:flex-row relative"
      onClick={e => e.stopPropagation()}
    >
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 p-3 bg-foreground/10 hover:bg-foreground/20 rounded-full backdrop-blur-md text-foreground transition-all z-20"
      >
        <Icons.X className="w-5 h-5" />
      </button>

      {/* Image Sidebar */}
      <div className="w-full md:w-2/5 h-64 md:h-auto relative overflow-hidden flex-shrink-0">
        <SacredImage src={saint.image} className="w-full h-full object-cover" alt={saint.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute bottom-8 left-8 right-8 text-white space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest bg-primary px-3 py-1.5 rounded-lg mb-4 inline-block">
            {CATEGORY_LABELS[saint.category] || saint.category}
          </span>
          <h2 className="text-4xl font-serif font-bold leading-tight">{saint.name}</h2>
          <p className="text-primary font-serif italic text-lg opacity-90">{saint.title}</p>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto no-scrollbar space-y-10">
        
        {/* Top Info Strip */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Icons.Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Dia de Festa</span>
              <span className="text-sm font-bold text-foreground">{saint.feastDay}</span>
            </div>
          </div>

          {saint.born && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center text-primary">
                <Icons.User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Nascimento</span>
                <span className="text-sm font-bold text-foreground truncate max-w-[150px] inline-block">{saint.born}</span>
              </div>
            </div>
          )}

          {saint.died && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <Icons.XCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Falecimento</span>
                <span className="text-sm font-bold text-foreground truncate max-w-[150px] inline-block">{saint.died}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Virtude Principal</span>
              <span className="text-sm font-bold text-foreground">{saint.virtues?.[0] || 'Santidade'}</span>
            </div>
          </div>

          <div className="flex-1 flex justify-end items-center gap-3">
            <AudioContentPlayer 
              text={`${saint.name}. ${saint.title}. ${saint.bio}. ${saint.fullBio || ''}. ${saint.quotes?.[0] || ''}.`}
              title="Ouvir conteúdo"
              className="h-9"
            />
          </div>

          <div className="flex-1 flex justify-end items-center gap-2">
            {(saint as any).url && (
              <Button 
                onClick={() => window.open((saint as any).url, '_blank')}
                variant="outline"
                className="bg-foreground/5 hover:bg-foreground/10 text-foreground border-border/20 text-[9px] font-black uppercase tracking-widest h-9 px-4 rounded-xl flex items-center gap-2 transition-all"
              >
                <Icons.Globe className="w-3 h-3" />
                Fonte Oficial
              </Button>
            )}
            
            <ShareButton
              title={saint.name}
              text={`${saint.name} — ${saint.title}. ${saint.quotes?.[0] || ''}`}
              variant="button"
              className="!px-4 !py-2.5 !text-[11px] !rounded-2xl !bg-foreground !text-background !font-black !uppercase !tracking-widest"
            />
          </div>

        </div>

        {/* Short Biography */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Info className="w-4 h-4" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Sua História</h3>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-lg font-serif italic text-foreground/90 leading-relaxed border-l-4 border-primary/20 pl-6 py-1">
              {parseTheologicalReferences(saint.bio).map((seg, i) => {
                if (seg.type === 'bibleRef') return <BibleVersePopover key={i} abbr={seg.abbr!} chapter={seg.chapter!} verse={seg.verse} label={seg.value} />;
                if (seg.type === 'catechismRef') return <CatechismPopover key={i} paragraph={seg.paragraph!} />;
                return <span key={i}>{seg.value}</span>;
              })}
            </p>
            {saint.fullBio && (
              <div className="mt-6 text-muted-foreground leading-relaxed text-sm space-y-4">
                {saint.fullBio.split('\n\n').map((paragraph, pIdx) => (
                  <p key={pIdx}>
                    {parseTheologicalReferences(paragraph).map((seg, sIdx) => {
                      if (seg.type === 'bibleRef') return <BibleVersePopover key={sIdx} abbr={seg.abbr!} chapter={seg.chapter!} verse={seg.verse} label={seg.value} />;
                      if (seg.type === 'catechismRef') return <CatechismPopover key={sIdx} paragraph={seg.paragraph!} />;
                      return <span key={sIdx}>{seg.value}</span>;
                    })}
                  </p>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Deep Content - Textos e Livros */}
        <DeepContentSection 
          content={saint as any} 
          title="Meditação e Aprofundamento" 
        />

        {/* Quote & Practical Application */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Quote Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Quote className="w-4 h-4" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Frase Marcante</h3>
            </div>
            <div className="bg-secondary/30 p-8 rounded-[2rem] border border-border relative group hover:border-primary/20 transition-all">
              <Quote className="absolute top-4 right-4 w-12 h-12 text-primary/5 group-hover:text-primary/10 transition-colors" />
              <p className="text-xl font-serif italic text-foreground relative z-10 leading-relaxed">
                {parseTheologicalReferences(saint.quotes?.[0] || "Tudo para a maior glória de Deus.").map((seg, i) => {
                  if (seg.type === 'bibleRef') return <BibleVersePopover key={i} abbr={seg.abbr!} chapter={seg.chapter!} verse={seg.verse} label={seg.value} />;
                  if (seg.type === 'catechismRef') return <CatechismPopover key={i} paragraph={seg.paragraph!} />;
                  return <span key={i}>{seg.value}</span>;
                })}
              </p>
            </div>
          </div>

          {/* Practical Application */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Heart className="w-4 h-4" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Aplicação Prática</h3>
            </div>
            <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10 relative group hover:bg-primary/10 transition-all">
              <Lightbulb className="absolute top-4 right-4 w-12 h-12 text-primary/10 group-hover:scale-110 transition-all" />
              <p className="text-sm font-medium text-foreground relative z-10 leading-relaxed italic">
                {parseTheologicalReferences(saint.aplicacaoPratica || "Hoje, procure imitar a humildade deste santo em suas tarefas ordinárias, oferecendo cada pequeno gesto ao Senhor com amor.").map((seg, i) => {
                  if (seg.type === 'bibleRef') return <BibleVersePopover key={i} abbr={seg.abbr!} chapter={seg.chapter!} verse={seg.verse} label={seg.value} />;
                  if (seg.type === 'catechismRef') return <CatechismPopover key={i} paragraph={seg.paragraph!} />;
                  return <span key={i}>{seg.value}</span>;
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Writings Section */}
        {saint.works && saint.works.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <BookOpen className="w-4 h-4" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Escritos e Obras</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {saint.works.map((work, idx) => (
                <div key={idx} className="p-4 bg-card border border-border rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Icons.Book className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{work.title}</p>
                      {work.year && <p className="text-[10px] text-muted-foreground uppercase">{work.year}</p>}
                    </div>
                  </div>
                  {work.url && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setViewingDoc({ url: work.url!, title: work.title })}
                      className="text-primary hover:bg-primary/10"
                    >
                      Ler <Icons.ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Suggested Journey */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-primary/5 rounded-[2rem] p-6 md:p-8 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6 group hover:bg-primary/10 transition-all shadow-sm"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
              <Icons.Route className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Transformar Inspiração em Prática</p>
              <h4 className="text-lg font-bold text-foreground font-serif leading-tight">Jornada {suggestedJourney.name}</h4>
              <p className="text-xs text-muted-foreground font-serif italic max-w-sm">
                Inspirada pela virtude de <span className="text-primary font-bold not-italic">{saint.virtues?.[0] || 'Santidade'}</span>.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => {
              navigate(`/jornadas/${suggestedJourney.id}`);
              onClose();
            }}
            className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 group/btn transition-all"
          >
            Começar Jornada <Icons.ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

      </div>
    </motion.div>
  </motion.div>
  
  <AnimatePresence>
    {viewingDoc && (
      <DocumentViewer 
        url={viewingDoc.url} 
        title={viewingDoc.title} 
        onClose={() => setViewingDoc(null)} 
      />
    )}
  </AnimatePresence>
  </>
  );
};

export default SaintDetail;
