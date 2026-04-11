import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import SacredImage from './SacredImage';
import ShareButton from './ShareButton';
import DocumentViewer from './DocumentViewer';
import DeepContentSection from './DeepContentSection';
import { type Saint } from '@/data/saints';
import { Sparkles, BookOpen, Quote, Shield, Info, Heart, Lightbulb, MessageSquare } from 'lucide-react';

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

const SaintDetail: React.FC<{ saint: Saint; onClose: () => void }> = ({ saint, onClose }) => {
  const [viewingDoc, setViewingDoc] = useState<{ url: string; title: string } | null>(null);

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

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Virtude Principal</span>
              <span className="text-sm font-bold text-foreground">{saint.virtues?.[0] || 'Santidade'}</span>
            </div>
          </div>

          <div className="flex-1" />

          <ShareButton
            title={saint.name}
            text={`${saint.name} — ${saint.title}. ${saint.quotes[0] || ''}`}
            variant="button"
            className="!px-4 !py-2.5 !text-[11px] !rounded-2xl !bg-foreground !text-background !font-black !uppercase !tracking-widest"
          />
        </div>

        {/* Short Biography */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Info className="w-4 h-4" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Sua História</h3>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-lg font-serif italic text-foreground/90 leading-relaxed border-l-4 border-primary/20 pl-6 py-1">
              {saint.bio}
            </p>
            {saint.fullBio && (
              <div className="mt-6 text-muted-foreground leading-relaxed text-sm space-y-4">
                {saint.fullBio.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}
          </div>
        </section>

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
                {saint.quotes[0] || "Tudo para a maior glória de Deus."}
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
                {saint.aplicacaoPratica || "Hoje, procure imitar a humildade deste santo em suas tarefas ordinárias, oferecendo cada pequeno gesto ao Senhor com amor."}
              </p>
            </div>
          </div>
        </div>

        {/* Deep Reflection */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Reflexão Profunda</h3>
          </div>
          <div className="bg-foreground text-background p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-background/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative z-10 space-y-6">
              <p className="text-xl md:text-2xl font-serif italic leading-snug text-background/90">
                {saint.interpretacaoProfunda || saint.reflexaoFinal || "A vida dos santos nos recorda que a santidade não é uma perfeição distante, mas uma amizade próxima e constante com Jesus Cristo."}
              </p>
              <div className="h-px w-20 bg-background/20" />
              <p className="text-xs uppercase tracking-[0.3em] font-black text-background/50">Meditação Diária</p>
            </div>
          </div>
        </section>

        {/* Secondary Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 bg-secondary/50 rounded-2xl border border-border">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Nascimento</span>
            <span className="text-xs font-bold text-foreground font-serif">{saint.born}</span>
          </div>
          <div className="p-5 bg-secondary/50 rounded-2xl border border-border">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Falecimento</span>
            <span className="text-xs font-bold text-foreground font-serif">{saint.died}</span>
          </div>
          <div className="p-5 bg-secondary/50 rounded-2xl border border-border col-span-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Padroeiro(a) de</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {saint.patronOf.map(p => (
                <span key={p} className="px-2 py-1 bg-background text-foreground text-[9px] font-black uppercase tracking-tighter rounded-md border border-border">{p}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Works */}
        {saint.works.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <BookOpen className="w-4 h-4" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Obras Principais</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {saint.works.map((w, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl group hover:border-primary/40 hover:bg-primary/5 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Icons.Book className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{w.title}</h4>
                    {w.year && <span className="text-[10px] text-muted-foreground">{w.year}</span>}
                  </div>
                  {w.url && (
                    <button 
                      onClick={() => setViewingDoc({ url: w.url!, title: w.title })} 
                      className="p-2 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                    >
                      <Icons.ArrowDown className="w-4 h-4 -rotate-90" />
                    </button>
                  )}
                </div>
              ))}
            </div>
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