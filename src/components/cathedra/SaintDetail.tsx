import React, { useState } from 'react';
import { callColloquium } from '@/services/aiService';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';
import SacredImage from './SacredImage';
import ShareButton from './ShareButton';
import DocumentViewer from './DocumentViewer';
import DeepContentSection from './DeepContentSection';
import { type Saint } from '@/data/saints';
import { AppRoute } from '@/types';
import { Sparkles, BookOpen, Quote, Shield, Info, Heart, Lightbulb, MessageSquare, Loader2, Sparkle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';
import AudioContentPlayer from './AudioContentPlayer';

const CATEGORY_LABELS: Record<string, string> = {
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
  const [logosReflection, setLogosReflection] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLogos, setShowLogos] = useState(autoReflect);

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

  React.useEffect(() => {
    if (autoReflect) {
      generateLogosReflection();
    }
  }, [autoReflect]);

  const generateLogosReflection = async () => {
    setIsGenerating(true);
    setShowLogos(true);
    setLogosReflection('');

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const prompt = `Como Logos (IA da Cathedra), gere uma reflexão profunda e personalizada sobre ${saint.name}. 
      
      Siga este roteiro rigorosamente:
      1. REALIDADE: Relacione a virtude principal (${saint.virtues?.[0] || 'santidade'}) de ${saint.name} com os desafios reais, pressões e dilemas de um católico no mundo moderno hoje. Como essa virtude se traduz em ações concretas no trabalho, na família ou na vida digital?
      2. PERGUNTA PROFUNDA: Gere uma pergunta provocativa e profunda que conecte a luta ou o exemplo de ${saint.name} com a alma e o estado espiritual do usuário agora.
      3. O CAMINHO: Sugira um "caminho" (uma ação prática, um pequeno sacrifício ou uma oração específica) inspirado no exemplo de ${saint.name} para o usuário realizar hoje.
      
      IMPORTANTE: Use os títulos "REALIDADE:", "PERGUNTA PROFUNDA:" e "O CAMINHO:" explicitamente no início de cada seção.
      Tom: Poético, visceral, encorajador e firme na doutrina católica. Use Markdown para formatar (negrito para ênfase). Seja breve mas impactante.`;

      const result = await callColloquium([{ role: 'user', content: prompt }], null, (content) => {
        // Remove recommendation metadata from UI display
        setLogosReflection(content.replace(/\[RECOMMENDATION:.*?\]/g, '').trim());
      });

      if (result.error) throw new Error(result.error);
    } catch (error) {
      console.error('Error generating Logos reflection:', error);
      setLogosReflection('Desculpe, não consegui conectar com Logos agora. Tente novamente em breve.');
    } finally {
      setIsGenerating(false);
    }
  };

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
            {!showLogos && (
              <Button 
                onClick={generateLogosReflection}
                variant="outline"
                className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase tracking-widest h-9 px-4 rounded-xl flex items-center gap-2 transition-all"
              >
                <Icons.Sparkles className="w-3 h-3" />
                Refletir com Logos
              </Button>
            )}
            
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
          {!showLogos && (
            <div className="flex justify-center pt-2">
              <Button 
                onClick={generateLogosReflection}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-widest h-12 px-8 rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-3 group transition-all"
              >
                <Icons.Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Viver este exemplo com Logos
              </Button>
            </div>
          )}
        </section>

        {/* Deep Content - Textos e Livros */}
        <DeepContentSection 
          content={saint as any} 
          title="Meditação e Aprofundamento" 
        />

        {/* Quote & Practical Application & Reflection */}
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
                O Logos recomenda que você cultive a virtude de <span className="text-primary font-bold not-italic">{saint.virtues?.[0] || 'Santidade'}</span> através desta trilha guiada.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => {
              onClose();
              navigate(`/jornadas/${suggestedJourney.id}`);
            }}
            className="w-full md:w-auto bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest px-8 h-14 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group-hover:bg-primary/90"
          >
            Viver isso na jornada <Icons.ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Reflexão Profunda</h3>
            </div>
            {!showLogos && (
              <Button 
                onClick={generateLogosReflection}
                className="bg-primary hover:bg-primary/90 text-primary-foreground border-none text-[10px] font-black uppercase tracking-widest h-9 px-6 rounded-full flex items-center gap-2 group transition-all shadow-lg shadow-primary/20"
              >
                <Icons.Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                Refletir com Logos
              </Button>
            )}
          </div>

          <div className="bg-foreground text-background p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group min-h-[200px] flex flex-col justify-center transition-all duration-700">
            <div className="absolute top-0 right-0 w-32 h-32 bg-background/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
            
            <AnimatePresence mode="wait">
              {!showLogos ? (
                <motion.div 
                  key="static"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative z-10 space-y-6"
                >
                  <p className="text-xl md:text-2xl font-serif italic leading-snug text-background/90">
                    {saint.interpretacaoProfunda || saint.reflexaoFinal || "A vida dos santos nos recorda que a santidade não é uma perfeição distante, mas uma amizade próxima e constante com Jesus Cristo."}
                  </p>
                  <div className="h-px w-20 bg-background/20" />
                  <p className="text-xs uppercase tracking-[0.3em] font-black text-background/50">Meditação Diária</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="logos"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative z-10 space-y-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      {isGenerating ? <Loader2 className="w-3 h-3 text-primary animate-spin" /> : <Icons.Sparkles className="w-3 h-3 text-primary" />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-background/40">Logos está guiando sua reflexão...</span>
                  </div>
                  
                  <div className="space-y-6">
                    {logosReflection ? (
                      logosReflection.split(/(?=REALIDADE:|PERGUNTA PROFUNDA:|O CAMINHO:)/).filter(Boolean).map((section, idx) => {
                        const isReality = section.includes('REALIDADE:');
                        const isQuestion = section.includes('PERGUNTA PROFUNDA:');
                        const isPath = section.includes('O CAMINHO:');
                        
                        let content = section.replace(/REALIDADE:|PERGUNTA PROFUNDA:|O CAMINHO:/, '').trim();
                        
                        return (
                          <div key={idx} className={`p-8 rounded-[2rem] ${isReality ? 'bg-primary/5 border border-primary/20' : isQuestion ? 'bg-secondary/40 border border-border shadow-inner' : isPath ? 'bg-primary text-primary-foreground shadow-2xl shadow-primary/30 border-t-4 border-primary-foreground/20' : ''}`}>
                            <div className="flex items-center gap-3 mb-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPath ? 'bg-primary-foreground/20' : 'bg-primary/10'}`}>
                                {isReality && <Icons.Globe className="w-4 h-4 text-primary" />}
                                {isQuestion && <Icons.MessageSquare className="w-4 h-4 text-primary" />}
                                {isPath && <Icons.Flame className="w-4 h-4 text-primary-foreground" />}
                              </div>
                              {isReality && <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Realidade Moderna</h4>}
                              {isQuestion && <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Para sua Alma</h4>}
                              {isPath && <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-foreground/70">O Caminho Prático</h4>}
                            </div>
                            <p className={`text-lg font-serif italic leading-relaxed ${isPath ? 'text-primary-foreground' : 'text-background/90'}`}>
                              {content}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-lg md:text-xl font-serif italic leading-relaxed text-background/90 whitespace-pre-wrap">
                        {isGenerating && "Conectando virtudes à sua vida..."}
                      </p>
                    )}
                  </div>

                  {!isGenerating && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="pt-6 border-t border-background/10"
                    >
                      <button 
                        onClick={() => setShowLogos(false)}
                        className="text-[9px] font-black uppercase tracking-widest text-background/40 hover:text-background/60 transition-colors"
                      >
                        ← Voltar para meditação padrão
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Patronage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-secondary/50 rounded-2xl border border-border">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Padroeiro(a) de</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {saint.patronOf.map(p => (
                <span key={p} className="px-2 py-1 bg-background text-foreground text-[9px] font-black uppercase tracking-tighter rounded-md border border-border">{p}</span>
              ))}
            </div>
          </div>
          {/* You can add more secondary info here */}
        </div>


        {/* Deep Connections - PRO ONLY */}
        {(saint.bibleRefs || saint.catechismRefs || saint.churchDocRefs) && (
          <section className="space-y-6 pt-6 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <Icons.Sparkles className="w-4 h-4" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Conexões Profundas</h3>
              </div>
              {!isPremium && (
                <span className="text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">
                  Conteúdo Premium
                </span>
              )}
            </div>

            {!isPremium ? (
              <div className="relative group cursor-pointer" onClick={() => navigate(AppRoute.PRICING)}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background/40 to-background/80 backdrop-blur-[2px] z-10 rounded-[2rem] flex items-center justify-center border border-primary/10">
                  <div className="text-center space-y-3 p-8">
                    <Icons.Lock className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h4 className="text-lg font-bold">Aprofunde seus estudos</h4>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Assine o Cathedra Pro para acessar referências bíblicas, parágrafos do Catecismo e documentos da Igreja relacionados a {saint.name}.
                    </p>
                    <Button size="sm" className="bg-primary text-white rounded-full px-8 shadow-lg shadow-primary/20">Ver Planos</Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-30 filter blur-md select-none pointer-events-none">
                  <div className="p-4 bg-muted rounded-2xl h-32" />
                  <div className="p-4 bg-muted rounded-2xl h-32" />
                  <div className="p-4 bg-muted rounded-2xl h-32" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
                {saint.bibleRefs && saint.bibleRefs.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Icons.Book className="w-3.5 h-3.5" /> Escritura
                    </h4>
                    <div className="space-y-2">
                      {saint.bibleRefs.map((ref, i) => {
                        const parsed = parseTheologicalReferences(ref.ref);
                        const bibleSeg = parsed.find(s => s.type === 'bibleRef');
                        return (
                          <div key={i} className="p-3 bg-secondary/30 rounded-xl border border-border/50 hover:border-primary/30 transition-colors space-y-1">
                            {bibleSeg ? (
                              <BibleVersePopover abbr={bibleSeg.abbr!} chapter={bibleSeg.chapter!} verse={bibleSeg.verse} label={ref.ref} />
                            ) : (
                              <p className="text-xs font-bold text-foreground">{ref.ref}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground italic mt-0.5">{ref.label}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {saint.catechismRefs && saint.catechismRefs.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Icons.Cross className="w-3.5 h-3.5" /> Catecismo
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {saint.catechismRefs.map(ref => (
                        <CatechismPopover key={ref} paragraph={ref} onNavigate={() => { onClose(); navigate('/catechism'); }} />
                      ))}
                    </div>
                  </div>
                )}

                {saint.churchDocRefs && saint.churchDocRefs.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Icons.FileText className="w-3.5 h-3.5" /> Documentos
                    </h4>
                    <div className="space-y-2">
                      {saint.churchDocRefs.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-card border border-border rounded-xl group hover:border-primary/40 transition-all">
                          <span className="text-[10px] font-bold text-foreground truncate pr-2">{doc.title}</span>
                          <button 
                            onClick={() => setViewingDoc({ url: doc.url, title: doc.title })}
                            className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
                          >
                            <Icons.ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Prayer */}
        {saint.prayer && (
          <section className="pt-6">
            <div className="bg-primary text-primary-foreground p-10 rounded-[3rem] shadow-2xl shadow-primary/20 text-center space-y-6">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Oração do Santo</span>
              <p className="text-2xl font-serif italic leading-relaxed">"{saint.prayer}"</p>
              <div className="pt-4">
                <ShareButton
                  title={`Oração de ${saint.name}`}
                  text={saint.prayer}
                  variant="button"
                  className="!bg-primary-foreground !text-primary !rounded-full !px-8"
                />
              </div>
            </div>
          </section>
        )}
      </div>
    </motion.div>
  </motion.div>
  {viewingDoc && <DocumentViewer url={viewingDoc.url} title={viewingDoc.title} onClose={() => setViewingDoc(null)} />}
  </>
  );
};

export default SaintDetail;
export { CATEGORY_LABELS };